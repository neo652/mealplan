'use client';

import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { UtensilsCrossed } from 'lucide-react';
import { useTransition } from 'react';
import { useUser, useToast, useFirestore } from '@/firebase';
import LoadingSpinner from './loading-spinner';
import { MealItems } from '@/lib/types';
import { generateLocalMealPlan } from '@/lib/meal-plan-generator';
import { writeBatch, doc } from 'firebase/firestore';
import { addDays, formatISO } from 'date-fns';


export default function AppHeader({ mealItems }: { mealItems: MealItems | null }) {
  const [isPending, startTransition] = useTransition();
  const { user } = useUser();
  const { toast } = useToast();
  const firestore = useFirestore();

  const handleGenerateNewPlan = () => {
    if (!user || !mealItems) return;
    startTransition(async () => {
      try {
        const plan = generateLocalMealPlan({
          breakfast: mealItems.breakfast,
          lunch: mealItems.lunch,
          dinner: mealItems.dinner,
          snack: mealItems.snack,
        });

        const batch = writeBatch(firestore);
        const planStartDate = new Date();
        
        const mealItemsRef = doc(firestore, 'users', user.uid, 'data', 'meal-items');
        batch.update(mealItemsRef, { planStartDate: formatISO(planStartDate) });

        plan.forEach((dailyMeal, index) => {
          const dayRef = doc(firestore, `users/${user.uid}/daily-meals/day-${index + 1}`);
          const mealDate = addDays(planStartDate, index);
          batch.set(dayRef, { ...dailyMeal, date: formatISO(mealDate) });
        });

        await batch.commit();

         toast({
          title: 'Success!',
          description: 'A new 14-day meal plan has been generated.',
        });
        
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'An unknown error occurred.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 md:px-6 shrink-0">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />
        <div className="flex items-center gap-2">
            <UtensilsCrossed className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold font-headline">MealGenius</h1>
        </div>
      </div>
      <Button onClick={handleGenerateNewPlan} disabled={isPending || !mealItems}>
        {isPending ? <LoadingSpinner /> : 'Generate New Plan'}
      </Button>
    </header>
  );
}
