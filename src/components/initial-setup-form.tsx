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
import { UtensilsCrossed } from 'lucide-react';
import LoadingSpinner from './loading-spinner';
import { MEAL_CATEGORIES, APP_OWNER_UID } from '@/lib/constants';
import type { MealCategory } from '@/lib/types';
import Image from 'next/image';
import {PlaceHolderImages} from '@/lib/placeholder-images';
import { generateLocalMealPlan } from '@/lib/meal-plan-generator';
import { writeBatch, doc } from 'firebase/firestore';
import { addDays, formatISO } from 'date-fns';

const formSchema = z.object({
  breakfast: z.string().min(1, 'Please enter at least one breakfast item.'),
  lunch: z.string().min(1, 'Please enter at least one lunch item.'),
  dinner: z.string().min(1, 'Please enter at least one dinner item.'),
  snack: z.string().min(1, 'Please enter at least one snack item.'),
});

export default function InitialSetupForm() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const formImage = PlaceHolderImages.find(p => p.id === 'initial-setup-hero');

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
        toast({ title: 'Error', description: 'You must be logged in to save your meal plan.', variant: 'destructive' });
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
        const plan = generateLocalMealPlan(mealItems);

        const batch = writeBatch(firestore);
        const planStartDate = new Date();
        
        const userDocRef = doc(firestore, 'users', APP_OWNER_UID);
        batch.set(userDocRef, { id: APP_OWNER_UID });

        const mealItemsRef = doc(firestore, 'users', APP_OWNER_UID, 'data', 'meal-items');
        batch.set(mealItemsRef, { ...mealItems, planStartDate: formatISO(planStartDate) });

        plan.forEach((dailyMeal, index) => {
          const dayRef = doc(firestore, `users/${APP_OWNER_UID}/daily-meals/day-${index + 1}`);
          const mealDate = addDays(planStartDate, index);
          batch.set(dayRef, { ...dailyMeal, date: formatISO(mealDate) });
        });

        await batch.commit();
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'An unknown error occurred.',
          variant: 'destructive',
        });
      }
    });
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
        {formImage && (
             <Image
                src={formImage.imageUrl}
                alt={formImage.description}
                fill
                className="object-cover -z-10 brightness-50"
                data-ai-hint={formImage.imageHint}
            />
        )}
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
                <UtensilsCrossed className="h-8 w-8 text-primary" />
                <h1 className="text-4xl font-bold font-headline">Welcome to MealGenius</h1>
            </div>
          <CardTitle className="text-2xl font-headline">Let's Get Started</CardTitle>
          <CardDescription>
            Enter your favorite meals to generate your first personalized meal plan.
            <br />
            Place each meal on a new line.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {MEAL_CATEGORIES.map(category => (
                  <FormField
                    key={category}
                    control={form.control}
                    name={category as MealCategory}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="capitalize text-lg font-headline">{category}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={`Oatmeal\nScrambled Eggs\nSmoothie...`}
                            className="resize-none h-40"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? <LoadingSpinner /> : 'Generate My Meal Plan'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
