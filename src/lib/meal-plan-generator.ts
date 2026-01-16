import type { DailyMeal, RawMealItems, MealCategory } from '@/lib/types';
import { MEAL_CATEGORIES } from './constants';

function shuffle<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function generateLocalMealPlan(mealItems: RawMealItems): Omit<DailyMeal, 'date'>[] {
  const plan: Omit<DailyMeal, 'date'>[] = [];
  
  for (let week = 0; week < 2; week++) {
    const weeklyMeals: { [key in MealCategory]: string[] } = {
      breakfast: shuffle(mealItems.breakfast),
      lunch: shuffle(mealItems.lunch),
      dinner: shuffle(mealItems.dinner),
      snack: shuffle(mealItems.snack),
    };

    for (let day = 0; day < 7; day++) {
      const dailyMeal: Partial<Omit<DailyMeal, 'date'>> = {};
      MEAL_CATEGORIES.forEach(category => {
        const mealsForCategory = weeklyMeals[category];
        if (mealsForCategory && mealsForCategory.length > 0) {
          // Use modulo to loop through available meals if not enough for a full week of unique meals
          dailyMeal[category] = mealsForCategory[day % mealsForCategory.length];
        } else {
          // Handle case where a category has no items
          dailyMeal[category] = 'No item available';
        }
      });
      plan.push(dailyMeal as Omit<DailyMeal, 'date'>);
    }
  }
  return plan;
}


export function suggestLocalAlternative(availableMeals: string[], currentMeal: string): string {
  if (availableMeals.length <= 1) {
    return currentMeal; // No other options
  }
  const otherMeals = availableMeals.filter(m => m !== currentMeal);
  if(otherMeals.length === 0) {
    return currentMeal; // All available meals are the same as the current one.
  }
  
  const randomIndex = Math.floor(Math.random() * otherMeals.length);
  return otherMeals[randomIndex];
}
