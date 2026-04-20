import type { DailyMeal, MealCategory, MealItems } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MealItem from './meal-item';
import { MEAL_CATEGORIES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type DayCardProps = {
  planId: string;
  day: number;
  meal: DailyMeal;
  isCurrentDay: boolean;
  mealItems: MealItems | null;
};

export default function DayCard({ planId, day, meal, isCurrentDay, mealItems }: DayCardProps) {
  const dayDate = new Date(meal.date);

  return (
    <Card className={cn('flex flex-col transition-shadow hover:shadow-md', isCurrentDay && 'border-primary ring-2 ring-primary shadow-lg')}>
      <CardHeader>
        <CardTitle className="font-headline text-lg flex justify-between items-center">
          <span>Day {day}</span>
          <span className="text-sm font-body font-normal text-muted-foreground">{format(dayDate, 'EEE, MMM d')}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between space-y-4">
        {MEAL_CATEGORIES.map((category) => (
          <MealItem
            key={category}
            planId={planId}
            day={day}
            category={category as MealCategory}
            mealName={meal[category as keyof Omit<DailyMeal, 'date'>]}
            mealItems={mealItems}
          />
        ))}
      </CardContent>
    </Card>
  );
}
