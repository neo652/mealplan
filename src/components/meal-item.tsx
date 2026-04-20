'use client';

import type { MealCategory, MealItems } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, ChevronDown, Check, Search, Shuffle } from 'lucide-react';
import { MealIcons } from '@/components/icons';
import { useUser, useToast, useFirestore } from '@/firebase';
import { useMemo, useState, useTransition } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import LoadingSpinner from './loading-spinner';
import { suggestLocalAlternative } from '@/lib/meal-plan-generator';
import { doc, updateDoc } from 'firebase/firestore';
import { planDailyMealPath } from '@/lib/plans';
import { cn } from '@/lib/utils';

type MealItemProps = {
  planId: string;
  day: number;
  category: MealCategory;
  mealName: string;
  mealItems: MealItems | null;
  variant?: 'default' | 'compact';
};

export default function MealItem({
  planId,
  day,
  category,
  mealName,
  mealItems,
  variant = 'default',
}: MealItemProps) {
  const { user } = useUser();
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [isChanging, startChangeTransition] = useTransition();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');

  const Icon = MealIcons[category];
  const availableMeals = mealItems ? mealItems[category] : [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return availableMeals;
    return availableMeals.filter(m => m.toLowerCase().includes(q));
  }, [availableMeals, query]);

  const handleRefresh = () => {
    if (!user) return;
    startRefreshTransition(async () => {
      try {
        const suggestedMeal = suggestLocalAlternative(availableMeals, mealName);
        const dayRef = doc(firestore, planDailyMealPath(planId, `day-${day}`));
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
        const dayRef = doc(firestore, planDailyMealPath(planId, `day-${day}`));
        await updateDoc(dayRef, { [category]: newMeal });
        setPickerOpen(false);
        setQuery('');
      } catch (error: any) {
        toast({
          title: `Could not change ${category}`,
          description: error.message,
          variant: 'destructive',
        });
      }
    });
  };

  const busy = isRefreshing || isChanging;
  const isCompact = variant === 'compact';

  const mealPicker = (
    <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={busy}
          aria-label={`Change ${category}`}
        >
          {isChanging ? <LoadingSpinner className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-0" onOpenAutoFocus={e => e.preventDefault()}>
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={`Search ${category}…`}
            className="h-7 border-0 px-0 shadow-none focus-visible:ring-0"
            autoFocus
          />
        </div>
        <div className="max-h-72 overflow-y-auto p-1">
          <button
            type="button"
            onClick={() => {
              handleRefresh();
              setPickerOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent/40"
          >
            <Shuffle className="h-4 w-4 text-accent" />
            <span className="font-medium">Surprise me</span>
          </button>
          <div className="my-1 h-px bg-border/60" />
          {filtered.length === 0 ? (
            <div className="px-2 py-6 text-center text-xs text-muted-foreground">
              No matches
            </div>
          ) : (
            filtered.map(meal => {
              const selected = meal === mealName;
              return (
                <button
                  key={meal}
                  type="button"
                  onClick={() => handleChange(meal)}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent/40',
                    selected && 'bg-accent/30 font-medium',
                  )}
                >
                  <span className="min-w-0 flex-1 break-words capitalize">{meal}</span>
                  {selected && <Check className="h-3.5 w-3.5 text-primary" />}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );

  if (isCompact) {
    return (
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 break-words text-sm font-semibold capitalize leading-snug">
          {mealName}
        </p>
        <div className="flex flex-shrink-0 items-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleRefresh}
            disabled={busy}
            aria-label={`Refresh ${category}`}
          >
            {isRefreshing ? <LoadingSpinner className="h-3.5 w-3.5" /> : <RefreshCw className="h-3.5 w-3.5" />}
          </Button>
          {mealPicker}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-2">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-semibold capitalize leading-snug">{mealName}</p>
          <p className="text-xs capitalize text-muted-foreground">{category}</p>
        </div>
      </div>
      <div className="flex flex-shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleRefresh}
          disabled={busy}
          aria-label={`Refresh ${category}`}
        >
          {isRefreshing ? <LoadingSpinner className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
        {mealPicker}
      </div>
    </div>
  );
}
