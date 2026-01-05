'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import SidebarContentComponent from '@/components/sidebar-content';
import AppHeader from '@/components/header';
import MealPlanDisplay from '@/components/meal-plan-display';
import { useUser } from '@/lib/hooks';
import LoadingSpinner from './loading-spinner';

export default function Dashboard() {
    const { dailyMeals, loading } = useUser();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContentComponent />
      </Sidebar>
      <SidebarInset>
        <div className="flex h-full flex-col">
          <AppHeader />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {dailyMeals ? <MealPlanDisplay meals={dailyMeals} /> : <div className="flex h-full items-center justify-center"><LoadingSpinner /></div>}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
