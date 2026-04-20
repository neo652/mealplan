'use client';

import { useUser, useCollection, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import InitialSetupForm from '@/components/initial-setup-form';
import Dashboard from '@/components/dashboard';
import LoadingSpinner from '@/components/loading-spinner';
import type { MealItems, DailyMeal } from '@/lib/types';
import { APP_OWNER_UID } from '@/lib/constants';


export default function ClientPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const mealItemsRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', APP_OWNER_UID, 'data', 'meal-items');
  }, [firestore, user]);

  const { data: mealItems, isLoading: isMealItemsLoading } = useDoc<MealItems>(mealItemsRef);

  const dailyMealsRef = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `users/${APP_OWNER_UID}/daily-meals`);
  }, [firestore, user]);

  const { data: dailyMeals, isLoading: isDailyMealsLoading } = useCollection<DailyMeal>(dailyMealsRef);

  // Show a spinner while the user auth state is loading, or if we have a user but are still fetching their meal items.
  // This prevents showing the setup form prematurely before we have checked if data exists.
  if (isUserLoading || (user && isMealItemsLoading)) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingSpinner className="h-12 w-12" />
      </div>
    );
  }

  // After loading, if we don't have meal items, it means it's the first time use or data was cleared.
  if (!mealItems) {
    return <InitialSetupForm />;
  }

  // Sorting meals by date. We create a new sorted array to avoid mutating state directly.
  const sortedDailyMeals = dailyMeals
    ? [...dailyMeals].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : [];

  return <Dashboard mealItems={mealItems} dailyMeals={isDailyMealsLoading ? null : sortedDailyMeals} />;
}
