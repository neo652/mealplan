'use server';

import { revalidatePath } from 'next/cache';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc, updateDoc, writeBatch, getDoc, collection, getDocs } from 'firebase/firestore';
import { suggestNewMealPlan } from '@/ai/flows/generate-meal-plan';
import { updateSingleMeal } from '@/ai/flows/suggest-alternative-meal';
import type { MealCategory, RawMealItems } from '@/lib/types';
import { firebaseConfig } from '@/lib/firebase';
import { addDays, formatISO } from 'date-fns';

// Initialize Firebase for server-side operations
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);


// Server actions in Next.js do not have access to the client-side auth context.
// We need to pass the user ID from the client to the server action.

export async function saveInitialMealItemsAndGeneratePlan(uid: string, mealItems: RawMealItems) {
  try {
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

export async function generateNewPlan(uid: string) {
  try {
    const mealItemsRef = doc(db, 'users', uid, 'data', 'meal-items');
    const mealItemsSnap = await getDoc(mealItemsRef);

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

export async function updateMealItem(uid: string, category: MealCategory, items: string[]) {
    try {
        const mealItemsRef = doc(db, 'users', uid, 'data', 'meal-items');
        await updateDoc(mealItemsRef, { [category]: items });

        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        return { error: error.message || 'Failed to update meal item.' };
    }
}

export async function suggestAlternativeMeal(uid: string, day: number, mealType: MealCategory, currentMeal: string) {
    try {
        const mealItemsRef = doc(db, 'users', uid, 'data', 'meal-items');
        const mealItemsSnap = await getDoc(mealItemsRef);

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


export async function manuallyUpdateMeal(uid: string, day: number, mealType: MealCategory, newMeal: string) {
    try {
        const dayRef = doc(db, `users/${uid}/daily-meals/day-${day}`);
        await updateDoc(dayRef, { [mealType]: newMeal });
        
        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        return { error: error.message || 'Failed to update meal.' };
    }
}
