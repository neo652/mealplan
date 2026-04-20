'use client';

import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import SidebarContentComponent from '@/components/sidebar-content';
import AppHeader from '@/components/header';
import MealPlanDisplay from '@/components/meal-plan-display';
import TodayHero from '@/components/today-hero';
import LoadingSpinner from './loading-spinner';
import { Button } from './ui/button';
import { CalendarRange, Sparkles } from 'lucide-react';
import { DailyMeal, MealItems } from '@/lib/types';
import { useTransition } from 'react';
import { useFirestore, useToast, useUser } from '@/firebase';
import { generateLocalMealPlan } from '@/lib/meal-plan-generator';
import { writeBatch, doc } from 'firebase/firestore';
import { addDays, formatISO } from 'date-fns';
import { planDailyMealPath, planMealItemsPath, touchPlan } from '@/lib/plans';

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
            {dailyMeals === null ? (
              <div className="flex h-full items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : dailyMeals.length === 0 ? (
              <EmptyPlanState plan={plan} mealItems={mealItems} />
            ) : (
              <>
                <TodayHero
                  planId={plan.id}
                  planName={plan.name}
                  meals={dailyMeals}
                  mealItems={mealItems}
                />
                <MealPlanDisplay planId={plan.id} meals={dailyMeals} mealItems={mealItems} />
              </>
            )}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function EmptyPlanState({
  plan,
  mealItems,
}: {
  plan: { id: string; name: string };
  mealItems: MealItems;
}) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const totalItems =
    (mealItems.breakfast?.length ?? 0) +
    (mealItems.lunch?.length ?? 0) +
    (mealItems.dinner?.length ?? 0) +
    (mealItems.snack?.length ?? 0);

  const handleGenerate = () => {
    if (!user) return;
    startTransition(async () => {
      try {
        const generated = generateLocalMealPlan({
          breakfast: mealItems.breakfast,
          lunch: mealItems.lunch,
          dinner: mealItems.dinner,
          snack: mealItems.snack,
        });
        const batch = writeBatch(firestore);
        const planStartDate = new Date();
        batch.set(doc(firestore, planMealItemsPath(plan.id)), { planStartDate: formatISO(planStartDate) }, { merge: true });
        generated.forEach((dailyMeal, index) => {
          const dayRef = doc(firestore, planDailyMealPath(plan.id, `day-${index + 1}`));
          batch.set(dayRef, { ...dailyMeal, date: formatISO(addDays(planStartDate, index)) });
        });
        await batch.commit();
        await touchPlan(firestore, plan.id, plan.name);
        toast({ title: 'Plan ready!', description: `Generated 14 days for ${plan.name}.` });
      } catch (err: any) {
        toast({ title: 'Error', description: err?.message ?? 'Unknown error', variant: 'destructive' });
      }
    });
  };

  return (
    <div className="relative mx-auto max-w-2xl pt-8 md:pt-16">
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/15 via-card to-accent/10 p-8 text-center shadow-sm md:p-12">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-accent/15 blur-3xl" />
        <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 text-primary">
          <CalendarRange className="h-8 w-8" />
        </div>
        <h2 className="relative mt-5 font-headline text-3xl font-bold">Ready when you are</h2>
        <p className="relative mx-auto mt-2 max-w-md text-muted-foreground">
          Your pantry has <span className="font-semibold text-foreground">{totalItems}</span> items.
          Hit the button below to build {plan.name}'s first 14-day plan.
        </p>
        <Button onClick={handleGenerate} disabled={isPending} size="lg" className="relative mt-6">
          {isPending ? (
            <LoadingSpinner className="h-4 w-4" />
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate 14-day plan
            </>
          )}
        </Button>
        <p className="relative mt-3 text-xs text-muted-foreground">
          You can tweak meal items in the sidebar before generating.
        </p>
      </div>
    </div>
  );
}
