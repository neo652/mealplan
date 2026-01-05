'use client';

import { useUser } from '@/lib/hooks';
import InitialSetupForm from '@/components/initial-setup-form';
import Dashboard from '@/components/dashboard';
import LoadingSpinner from '@/components/loading-spinner';

export default function ClientPage() {
  const { user, mealItems, dailyMeals, loading } = useUser();

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingSpinner className="h-12 w-12" />
      </div>
    );
  }

  if (!mealItems) {
    return <InitialSetupForm />;
  }

  return <Dashboard />;
}
