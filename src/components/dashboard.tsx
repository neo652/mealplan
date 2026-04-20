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
  plan: { id: string; name: string };
  mealItems: MealItems;
  dailyMeals: DailyMeal[] | null;
  onSwitchPlan: () => void;
  onSelectPlan: (plan: { id: string; name: string }) => void;
}

export default function Dashboard({ plan, mealItems, dailyMeals, onSwitchPlan, onSelectPlan }: DashboardProps) {

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContentComponent plan={plan} mealItems={mealItems} />
      </Sidebar>
      <SidebarInset>
        <div className="flex h-full flex-col">
          <AppHeader
            plan={plan}
            mealItems={mealItems}
            onSwitchPlan={onSwitchPlan}
            onSelectPlan={onSelectPlan}
          />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {dailyMeals ? <MealPlanDisplay planId={plan.id} meals={dailyMeals} mealItems={mealItems} /> : <div className="flex h-full items-center justify-center"><LoadingSpinner /></div>}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
