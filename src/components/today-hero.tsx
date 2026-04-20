'use client';

import type { DailyMeal, MealCategory, MealItems } from '@/lib/types';
import { MEAL_CATEGORIES } from '@/lib/constants';
import { MealIcons } from './icons';
import MealItem from './meal-item';
import { differenceInCalendarDays, format, startOfDay } from 'date-fns';

type Props = {
  planId: string;
  planName: string;
  meals: DailyMeal[];
  mealItems: MealItems | null;
};

const GREETINGS = [
  { start: 4, end: 11, text: 'Good morning' },
  { start: 11, end: 16, text: 'Good afternoon' },
  { start: 16, end: 22, text: 'Good evening' },
];

function greetingFor(date: Date, name: string): string {
  const h = date.getHours();
  const g = GREETINGS.find(x => h >= x.start && h < x.end)?.text ?? 'Hello';
  return `${g}, ${name}`;
}

export default function TodayHero({ planId, planName, meals, mealItems }: Props) {
  const planStartDate = mealItems?.planStartDate ? new Date(mealItems.planStartDate) : new Date();
  const today = startOfDay(new Date());
  const currentDayIndex = differenceInCalendarDays(today, startOfDay(planStartDate));
  const todayMeal = meals[currentDayIndex];

  const inPlan = currentDayIndex >= 0 && currentDayIndex < meals.length && todayMeal;
  const dayNumber = currentDayIndex + 1;

  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/15 via-card to-accent/10 p-5 md:p-7 shadow-sm">
      <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -bottom-24 -left-16 h-60 w-60 rounded-full bg-accent/15 blur-3xl" />

      <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {inPlan ? `Today · Day ${dayNumber} of ${meals.length}` : 'Today'}
          </div>
          <h2 className="mt-1 font-headline text-2xl md:text-3xl font-bold">
            {greetingFor(new Date(), planName)}
          </h2>
          <p className="text-sm text-muted-foreground">{format(new Date(), 'EEEE, MMMM d')}</p>
        </div>
      </div>

      {inPlan ? (
        <div className="relative mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {MEAL_CATEGORIES.map(category => {
            const Icon = MealIcons[category as MealCategory];
            return (
              <div
                key={category}
                className="rounded-xl border border-border/60 bg-background/70 p-3 backdrop-blur"
              >
                <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" />
                  {category}
                </div>
                <div className="mt-2">
                  <MealItem
                    planId={planId}
                    day={dayNumber}
                    category={category as MealCategory}
                    mealName={todayMeal[category as keyof Omit<DailyMeal, 'date'>]}
                    mealItems={mealItems}
                    variant="compact"
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="relative mt-4 text-sm text-muted-foreground">
          Today isn't in the current plan window. Generate a new plan to start from today.
        </p>
      )}
    </div>
  );
}
