'use client';

import { useUser, useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import InitialSetupForm from '@/components/initial-setup-form';
import Dashboard from '@/components/dashboard';
import LoadingSpinner from '@/components/loading-spinner';
import type { MealItems, DailyMeal } from '@/lib/types';


export default function ClientPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const mealItemsRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid, 'data', 'meal-items');
  }, [firestore, user]);

  // The useDoc hook is not available in the scaffolded files, so we'll use useCollection and take the first item.
  // This is a temporary workaround.
  const { data: mealItemsData, isLoading: isMealItemsLoading } = useCollection<MealItems>(
    useMemoFirebase(() => {
      if (!mealItemsRef) return null;
      // This is not a real collection, but we adapt to the hook we have
      return collection(mealItemsRef.parent, mealItemsRef.id);
    }, [mealItemsRef])
  );
  const mealItems = mealItemsData?.[0];


  const dailyMealsRef = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `users/${user.uid}/daily-meals`);
  }, [firestore, user]);

  const { data: dailyMeals, isLoading: isDailyMealsLoading } = useCollection<DailyMeal>(dailyMealsRef);

  const loading = isUserLoading || isMealItemsLoading || isDailyMealsLoading;
  
  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingSpinner className="h-12 w-12" />
      </div>
    );
  }

  // Sorting meals by date
  const sortedDailyMeals = dailyMeals?.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (!mealItems) {
    return <InitialSetupForm />;
  }

  return <Dashboard mealItems={mealItems} dailyMeals={sortedDailyMeals ?? null} />;
}
