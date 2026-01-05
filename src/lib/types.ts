import { MEAL_CATEGORIES } from "./constants";

export type MealCategory = typeof MEAL_CATEGORIES[number];

export type RawMealItems = {
  breakfast: string[];
  lunch: string[];
  dinner: string[];
  snack: string[];
};

export type MealItems = RawMealItems & {
  planStartDate?: string;
};

export type DailyMeal = {
  date: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  snack: string;
};
