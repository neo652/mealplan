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
import LoadingSpinner from './loading-spinner';
import { DailyMeal, MealItems } from '@/lib/types';

interface DashboardProps {
  mealItems: MealItems | null;
  dailyMeals: DailyMeal[] | null;
}

export default function Dashboard({ mealItems, dailyMeals }: DashboardProps) {

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContentComponent mealItems={mealItems} />
      </Sidebar>
      <SidebarInset>
        <div className="flex h-full flex-col">
          <AppHeader mealItems={mealItems} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {dailyMeals ? <MealPlanDisplay meals={dailyMeals} mealItems={mealItems} /> : <div className="flex h-full items-center justify-center"><LoadingSpinner /></div>}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
