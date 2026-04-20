'use client';

import type { DailyMeal, MealItems } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DayCard from './day-card';
import { differenceInCalendarDays, startOfDay } from 'date-fns';

type MealPlanDisplayProps = {
  planId: string;
  meals: DailyMeal[];
  mealItems: MealItems | null;
};

export default function MealPlanDisplay({ planId, meals, mealItems }: MealPlanDisplayProps) {

  const planStartDate = mealItems?.planStartDate ? new Date(mealItems.planStartDate) : new Date();
  const today = startOfDay(new Date());
  const currentDayIndex = differenceInCalendarDays(today, startOfDay(planStartDate));

  const week1 = meals.slice(0, 7);
  const week2 = meals.slice(7, 14);

  return (
    <Tabs defaultValue="week1" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="week1">Week 1</TabsTrigger>
        <TabsTrigger value="week2">Week 2</TabsTrigger>
      </TabsList>
      <TabsContent value="week1">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {week1.map((meal, index) => (
            <DayCard key={`day-${index + 1}`} planId={planId} day={index + 1} meal={meal} isCurrentDay={index === currentDayIndex} mealItems={mealItems} />
          ))}
        </div>
      </TabsContent>
      <TabsContent value="week2">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {week2.map((meal, index) => (
            <DayCard key={`day-${index + 8}`} planId={planId} day={index + 8} meal={meal} isCurrentDay={index + 7 === currentDayIndex} mealItems={mealItems} />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}
