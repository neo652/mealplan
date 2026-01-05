import type { DailyMeal, MealCategory } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MealItem from './meal-item';
import { MEAL_CATEGORIES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type DayCardProps = {
  day: number;
  meal: DailyMeal;
  isCurrentDay: boolean;
};

export default function DayCard({ day, meal, isCurrentDay }: DayCardProps) {
  const dayDate = new Date(meal.date);

  return (
    <Card className={cn('flex flex-col', isCurrentDay && 'border-primary ring-2 ring-primary')}>
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
            day={day}
            category={category as MealCategory}
            mealName={meal[category as  keyof Omit<DailyMeal, 'date'>]}
          />
        ))}
      </CardContent>
    </Card>
  );
}
