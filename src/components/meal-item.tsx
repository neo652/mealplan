'use client';

import type { MealCategory, MealItems } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { RefreshCw, ChevronDown } from 'lucide-react';
import { MealIcons } from '@/components/icons';
import { useUser, useToast, useFirestore } from '@/firebase';
import { useTransition } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import LoadingSpinner from './loading-spinner';
import { suggestLocalAlternative } from '@/lib/meal-plan-generator';
import { doc, updateDoc } from 'firebase/firestore';
import { APP_OWNER_UID } from '@/lib/constants';

type MealItemProps = {
  day: number;
  category: MealCategory;
  mealName: string;
  mealItems: MealItems | null;
};

export default function MealItem({ day, category, mealName, mealItems }: MealItemProps) {
  const { user } = useUser();
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [isChanging, startChangeTransition] = useTransition();
  const { toast } = useToast();
  const firestore = useFirestore();

  const Icon = MealIcons[category];
  const availableMeals = mealItems ? mealItems[category] : [];

  const handleRefresh = () => {
    if (!user) return;
    startRefreshTransition(async () => {
      try {
        const suggestedMeal = suggestLocalAlternative(availableMeals, mealName);

        const dayRef = doc(firestore, `users/${APP_OWNER_UID}/daily-meals/day-${day}`);
        await updateDoc(dayRef, { [category]: suggestedMeal });
        
      } catch (error: any) {
        toast({
          title: `Could not refresh ${category}`,
          description: error.message,
          variant: 'destructive',
        });
      }
    });
  };

  const handleChange = (newMeal: string) => {
    if (newMeal === mealName || !user) return;
    startChangeTransition(async () => {
      try {
        const dayRef = doc(firestore, `users/${APP_OWNER_UID}/daily-meals/day-${day}`);
        await updateDoc(dayRef, { [category]: newMeal });
      } catch (error: any) {
        toast({
          title: `Could not change ${category}`,
          description: error.message,
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
