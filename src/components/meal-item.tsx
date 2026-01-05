'use client';

import type { MealCategory, RawMealItems } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { RefreshCw, ChevronDown } from 'lucide-react';
import { MealIcons } from '@/components/icons';
import { useUser, useToast } from '@/firebase';
import { useTransition } from 'react';
import { suggestAlternativeMeal, manuallyUpdateMeal } from '@/app/actions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import LoadingSpinner from './loading-spinner';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';

type MealItemProps = {
  day: number;
  category: MealCategory;
  mealName: string;
};

export default function MealItem({ day, category, mealName }: MealItemProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [isChanging, startChangeTransition] = useTransition();
  const { toast } = useToast();

  const mealItemsRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid, 'data', 'meal-items');
  }, [firestore, user]);

  const { data: mealItemsData } = useCollection<RawMealItems>(
    useMemoFirebase(() => {
      if (!mealItemsRef) return null;
      return collection(mealItemsRef.parent, mealItemsRef.id);
    }, [mealItemsRef])
  );
  const mealItems = mealItemsData?.[0];

  const Icon = MealIcons[category];
  const availableMeals = mealItems ? mealItems[category] : [];

  const handleRefresh = () => {
    if (!user) return;
    startRefreshTransition(async () => {
      const result = await suggestAlternativeMeal(user.uid, day, category, mealName);
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
    if (newMeal === mealName || !user) return;
    startChangeTransition(async () => {
      const result = await manuallyUpdateMeal(user.uid, day, category, newMeal);
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
