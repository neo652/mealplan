'use client';

import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { UtensilsCrossed, LogOut, ChevronDown, Sparkles } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { useUser, useToast, useFirestore } from '@/firebase';
import LoadingSpinner from './loading-spinner';
import { MealItems } from '@/lib/types';
import { generateLocalMealPlan } from '@/lib/meal-plan-generator';
import { writeBatch, doc } from 'firebase/firestore';
import { addDays, formatISO } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { avatarGradient, initialsOf } from '@/lib/constants';
import { listPlans, planDailyMealPath, planMealItemsPath, PlanSummary, touchPlan } from '@/lib/plans';
import { trackEvent } from '@/lib/analytics';

type Props = {
  plan: { id: string; name: string };
  mealItems: MealItems | null;
  onSwitchPlan: () => void;
  onSelectPlan: (plan: { id: string; name: string }) => void;
};

export default function AppHeader({ plan, mealItems, onSwitchPlan, onSelectPlan }: Props) {
  const [isPending, startTransition] = useTransition();
  const { user } = useUser();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [otherPlans, setOtherPlans] = useState<PlanSummary[]>([]);

  useEffect(() => {
    listPlans(firestore)
      .then(all => setOtherPlans(all.filter(p => p.id !== plan.id)))
      .catch(() => setOtherPlans([]));
  }, [firestore, plan.id]);

  const handleGenerateNewPlan = () => {
    if (!user || !mealItems) return;
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

        const mealItemsRef = doc(firestore, planMealItemsPath(plan.id));
        batch.set(mealItemsRef, { planStartDate: formatISO(planStartDate) }, { merge: true });

        generated.forEach((dailyMeal, index) => {
          const dayRef = doc(firestore, planDailyMealPath(plan.id, `day-${index + 1}`));
          const mealDate = addDays(planStartDate, index);
          batch.set(dayRef, { ...dailyMeal, date: formatISO(mealDate) });
        });

        await batch.commit();
        await touchPlan(firestore, plan.id, plan.name);
        trackEvent('plan_generated', { source: 'header' });

        toast({
          title: 'Fresh plan ready!',
          description: `Generated a new 14-day plan for ${plan.name}.`,
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

  const gradient = avatarGradient(plan.name);
  const initials = initialsOf(plan.name);

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card/90 backdrop-blur px-4 md:px-6 shrink-0">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold font-headline">MealPlans</h1>
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        <Button onClick={handleGenerateNewPlan} disabled={isPending || !mealItems} size="sm">
          {isPending ? (
            <LoadingSpinner className="h-4 w-4" />
          ) : (
            <>
              <Sparkles className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">Generate new plan</span>
              <span className="sm:hidden">New plan</span>
            </>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full border border-border/60 bg-background/60 py-1 pl-1 pr-3 transition hover:border-primary/50 hover:bg-background">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-sm font-bold text-white`}
              >
                {initials}
              </span>
              <span className="hidden text-sm font-medium sm:inline">{plan.name}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Signed in as {plan.name}</DropdownMenuLabel>
            {otherPlans.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                  Switch to
                </DropdownMenuLabel>
                {otherPlans.slice(0, 6).map(p => (
                  <DropdownMenuItem
                    key={p.id}
                    onSelect={() => {
                      trackEvent('plan_switched');
                      onSelectPlan({ id: p.id, name: p.name });
                    }}
                  >
                    <span
                      className={`mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient(
                        p.name,
                      )} text-[10px] font-bold text-white`}
                    >
                      {initialsOf(p.name)}
                    </span>
                    {p.name}
                  </DropdownMenuItem>
                ))}
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onSwitchPlan}>
              <LogOut className="mr-2 h-4 w-4" />
              Switch user
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
