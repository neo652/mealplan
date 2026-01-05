'use client';

import type { MealCategory } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { RefreshCw, ChevronDown } from 'lucide-react';
import { MealIcons } from '@/components/icons';
import { useUser } from '@/lib/hooks';
import { useTransition } from 'react';
import { suggestAlternativeMeal, manuallyUpdateMeal } from '@/app/actions';
import { useToast } from '@/lib/hooks';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import LoadingSpinner from './loading-spinner';

type MealItemProps = {
  day: number;
  category: MealCategory;
  mealName: string;
};

export default function MealItem({ day, category, mealName }: MealItemProps) {
  const { mealItems } = useUser();
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [isChanging, startChangeTransition] = useTransition();
  const { toast } = useToast();

  const Icon = MealIcons[category];
  const availableMeals = mealItems ? mealItems[category] : [];

  const handleRefresh = () => {
    startRefreshTransition(async () => {
      const result = await suggestAlternativeMeal(day, category, mealName);
      if (result?.error) {
        toast({
          title: `Could not refresh ${category}`,
          description: result.error,
          variant: 'destructive',
        });
      }
    });
  };

  const handleChange = (newMeal: string) => {
    if (newMeal === mealName) return;
    startChangeTransition(async () => {
      const result = await manuallyUpdateMeal(day, category, newMeal);
      if (result?.error) {
        toast({
          title: `Could not change ${category}`,
          description: result.error,
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-3 truncate">
        <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        <div className="truncate">
          <p className="text-sm font-semibold capitalize truncate">{mealName}</p>
          <p className="text-xs text-muted-foreground capitalize">{category}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleRefresh}
          disabled={isRefreshing || isChanging}
          aria-label={`Refresh ${category}`}
        >
          {isRefreshing ? <LoadingSpinner className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={isRefreshing || isChanging}
              aria-label={`Change ${category}`}
            >
              {isChanging ? <LoadingSpinner className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {availableMeals.map((meal) => (
              <DropdownMenuItem key={meal} onSelect={() => handleChange(meal)}>
                {meal}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
