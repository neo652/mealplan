'use server';

import { revalidatePath } from 'next/cache';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, updateDoc, writeBatch, collection } from 'firebase/firestore';
import { suggestNewMealPlan } from '@/ai/flows/generate-meal-plan';
import { updateSingleMeal } from '@/ai/flows/suggest-alternative-meal';
import type { MealCategory, MealItems, RawMealItems } from '@/lib/types';
import { MEAL_CATEGORIES } from '@/lib/constants';
import { addDays, formatISO } from 'date-fns';

async function getUserId() {
  // In a server action, auth().currentUser is not available.
  // We rely on the client to provide the UID, or we'd need a different auth pattern.
  // For this app, we'll assume anonymous auth is handled and we can get a user session.
  // The official way to get user in server actions is still evolving.
  // For this project, we'll use this workaround of getting current session.
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return user.uid;
}


export async function saveInitialMealItemsAndGeneratePlan(mealItems: RawMealItems) {
  try {
    const uid = await getUserId();
    const mealItemsRef = doc(db, 'users', uid, 'data', 'meal-items');
    
    // Generate plan first
    const plan = await suggestNewMealPlan({
      breakfastItems: mealItems.breakfast,
      lunchItems: mealItems.lunch,
      dinnerItems: mealItems.dinner,
      snackItems: mealItems.snack,
    });

    // Save meal items and plan in a batch
    const batch = writeBatch(db);
    const planStartDate = new Date();
    batch.set(mealItemsRef, { ...mealItems, planStartDate });

    plan.forEach((dailyMeal, index) => {
      const dayRef = doc(db, `users/${uid}/daily-meals/day-${index + 1}`);
      const mealDate = addDays(planStartDate, index);
      batch.set(dayRef, { ...dailyMeal, date: formatISO(mealDate) });
    });

    await batch.commit();

    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Error in saveInitialMealItemsAndGeneratePlan:', error);
    return { error: error.message || 'An unknown error occurred.' };
  }
}

export async function generateNewPlan() {
  try {
    const uid = await getUserId();
    const mealItemsRef = doc(db, 'users', uid, 'data', 'meal-items');
    const mealItemsSnap = await mealItemsRef.get();

    if (!mealItemsSnap.exists()) {
      throw new Error('Meal items not found. Please set up your meals first.');
    }
    const mealItems = mealItemsSnap.data() as RawMealItems;
    
    const plan = await suggestNewMealPlan({
      breakfastItems: mealItems.breakfast,
      lunchItems: mealItems.lunch,
      dinnerItems: mealItems.dinner,
      snackItems: mealItems.snack,
    });

    const batch = writeBatch(db);
    const planStartDate = new Date();
    
    // Update the start date on the meal-items document
    batch.update(mealItemsRef, { planStartDate });

    plan.forEach((dailyMeal, index) => {
      const dayRef = doc(db, `users/${uid}/daily-meals/day-${index + 1}`);
      const mealDate = addDays(planStartDate, index);
      batch.set(dayRef, { ...dailyMeal, date: formatISO(mealDate) });
    });

    await batch.commit();

    revalidatePath('/');
    return { success: true };

  } catch (error: any) {
    console.error('Error in generateNewPlan:', error);
    return { error: error.message || 'An unknown error occurred.' };
  }
}

export async function updateMealItem(category: MealCategory, items: string[]) {
    try {
        const uid = await getUserId();
        const mealItemsRef = doc(db, 'users', uid, 'data', 'meal-items');
        await updateDoc(mealItemsRef, { [category]: items });

        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        return { error: error.message || 'Failed to update meal item.' };
    }
}

export async function suggestAlternativeMeal(day: number, mealType: MealCategory, currentMeal: string) {
    try {
        const uid = await getUserId();
        const mealItemsRef = doc(db, 'users', uid, 'data', 'meal-items');
        const mealItemsSnap = await mealItemsRef.get();

        if (!mealItemsSnap.exists()) throw new Error('Meal items not found.');
        
        const availableMeals = (mealItemsSnap.data() as RawMealItems)[mealType];
        
        const result = await updateSingleMeal({
            mealType,
            availableMeals,
            currentMeal,
        });

        const dayRef = doc(db, `users/${uid}/daily-meals/day-${day}`);
        await updateDoc(dayRef, { [mealType]: result.suggestedMeal });
        
        revalidatePath('/');
        return { success: true };

    } catch (error: any) {
        return { error: error.message || 'Failed to suggest an alternative meal.' };
    }
}


export async function manuallyUpdateMeal(day: number, mealType: MealCategory, newMeal: string) {
    try {
        const uid = await getUserId();
        const dayRef = doc(db, `users/${uid}/daily-meals/day-${day}`);
        await updateDoc(dayRef, { [mealType]: newMeal });
        
        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        return { error: error.message || 'Failed to update meal.' };
    }
}
