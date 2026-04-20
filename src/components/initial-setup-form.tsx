'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useTransition } from 'react';
import { useUser, useToast, useFirestore } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UtensilsCrossed, Sparkles } from 'lucide-react';
import LoadingSpinner from './loading-spinner';
import { MEAL_CATEGORIES, avatarGradient, initialsOf } from '@/lib/constants';
import type { MealCategory } from '@/lib/types';
import { generateLocalMealPlan } from '@/lib/meal-plan-generator';
import { writeBatch, doc } from 'firebase/firestore';
import { addDays, formatISO } from 'date-fns';
import { planDailyMealPath, planMealItemsPath, touchPlan } from '@/lib/plans';

const formSchema = z.object({
  breakfast: z.string().min(1, 'Please enter at least one breakfast item.'),
  lunch: z.string().min(1, 'Please enter at least one lunch item.'),
  dinner: z.string().min(1, 'Please enter at least one dinner item.'),
  snack: z.string().min(1, 'Please enter at least one snack item.'),
});

type Props = {
  plan: { id: string; name: string };
};

export default function InitialSetupForm({ plan }: Props) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      breakfast: '',
      lunch: '',
      dinner: '',
      snack: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ title: 'Error', description: 'Authentication is still initializing — try again.', variant: 'destructive' });
      return;
    }
    startTransition(async () => {
      const mealItems = {
        breakfast: values.breakfast.split('\n').filter(item => item.trim() !== ''),
        lunch: values.lunch.split('\n').filter(item => item.trim() !== ''),
        dinner: values.dinner.split('\n').filter(item => item.trim() !== ''),
        snack: values.snack.split('\n').filter(item => item.trim() !== ''),
      };

      try {
        const generated = generateLocalMealPlan(mealItems);

        const batch = writeBatch(firestore);
        const planStartDate = new Date();

        batch.set(
          doc(firestore, planMealItemsPath(plan.id)),
          { ...mealItems, planStartDate: formatISO(planStartDate) },
        );

        generated.forEach((dailyMeal, index) => {
          const dayRef = doc(firestore, planDailyMealPath(plan.id, `day-${index + 1}`));
          const mealDate = addDays(planStartDate, index);
          batch.set(dayRef, { ...dailyMeal, date: formatISO(mealDate) });
        });

        await batch.commit();
        await touchPlan(firestore, plan.id, plan.name);
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'An unknown error occurred.',
          variant: 'destructive',
        });
      }
    });
  }

  const gradient = avatarGradient(plan.name);
  const initials = initialsOf(plan.name);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4 md:p-8">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-background via-background to-primary/20" />
      <div className="absolute -z-10 top-1/4 -left-24 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -z-10 bottom-0 right-0 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />

      <Card className="w-full max-w-4xl border-border/60 bg-card/80 backdrop-blur shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-xl font-bold text-white shadow-md ring-4 ring-background`}
            >
              {initials}
            </span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <UtensilsCrossed className="h-6 w-6 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold font-headline">Welcome, {plan.name}</h1>
          </div>
          <CardTitle className="text-xl font-headline mt-1 font-normal text-muted-foreground">
            Let's set up your meals
          </CardTitle>
          <CardDescription className="mt-1">
            Enter your favorite meals — one per line — and we'll build your first 14-day plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {MEAL_CATEGORIES.map(category => (
                  <FormField
                    key={category}
                    control={form.control}
                    name={category as MealCategory}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="capitalize text-base font-headline">{category}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={`Oatmeal\nScrambled Eggs\nSmoothie...`}
                            className="resize-none h-36 bg-background/60"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <Button type="submit" className="w-full" disabled={isPending} size="lg">
                {isPending ? (
                  <LoadingSpinner />
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate my meal plan
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
