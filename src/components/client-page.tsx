'use client';

import { useUser, useCollection, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import InitialSetupForm from '@/components/initial-setup-form';
import Dashboard from '@/components/dashboard';
import LoadingSpinner from '@/components/loading-spinner';
import PlanPicker from '@/components/plan-picker';
import { useCurrentPlan } from '@/hooks/use-current-plan';
import type { MealItems, DailyMeal } from '@/lib/types';
import { planDailyMealPath, planMealItemsPath } from '@/lib/plans';


export default function ClientPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { plan, isHydrated, selectPlan, clearPlan } = useCurrentPlan();

  const planId = plan?.id ?? null;

  const mealItemsRef = useMemoFirebase(() => {
    if (!user || !planId) return null;
    return doc(firestore, planMealItemsPath(planId));
  }, [firestore, user, planId]);

  const { data: mealItems, isLoading: isMealItemsLoading } = useDoc<MealItems>(mealItemsRef);

  const dailyMealsRef = useMemoFirebase(() => {
    if (!user || !planId) return null;
    return collection(firestore, `plans/${planId}/daily-meals`);
  }, [firestore, user, planId]);

  const { data: dailyMeals, isLoading: isDailyMealsLoading } = useCollection<DailyMeal>(dailyMealsRef);

  if (!isHydrated || isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingSpinner className="h-12 w-12" />
      </div>
    );
  }

  if (!plan) {
    return <PlanPicker onPlanSelected={selectPlan} />;
  }

  if (user && isMealItemsLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingSpinner className="h-12 w-12" />
      </div>
    );
  }

  if (!mealItems) {
    return <InitialSetupForm plan={plan} />;
  }

  const sortedDailyMeals = dailyMeals
    ? [...dailyMeals].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : [];

  return (
    <Dashboard
      plan={plan}
      mealItems={mealItems}
      dailyMeals={isDailyMealsLoading ? null : sortedDailyMeals}
      onSwitchPlan={clearPlan}
      onSelectPlan={selectPlan}
    />
  );
}
