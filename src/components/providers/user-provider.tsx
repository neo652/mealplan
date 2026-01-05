'use client';

import { createContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, signInAnonymously, type User } from 'firebase/auth';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { MealItems, DailyMeal } from '@/lib/types';

interface UserContextType {
  user: User | null;
  loading: boolean;
  mealItems: MealItems | null;
  dailyMeals: DailyMeal[] | null;
}

export const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  mealItems: null,
  dailyMeals: null,
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mealItems, setMealItems] = useState<MealItems | null>(null);
  const [dailyMeals, setDailyMeals] = useState<DailyMeal[] | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
      } else {
        try {
          const userCredential = await signInAnonymously(auth);
          setUser(userCredential.user);
        } catch (error) {
          console.error('Anonymous sign-in failed:', error);
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      // Listener for meal items
      const mealItemsDocRef = doc(db, 'users', user.uid, 'data', 'meal-items');
      const unsubscribeMealItems = onSnapshot(mealItemsDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const items: MealItems = {
            breakfast: data.breakfast || [],
            lunch: data.lunch || [],
            dinner: data.dinner || [],
            snack: data.snack || [],
            planStartDate: data.planStartDate?.toDate().toISOString(),
          };
          setMealItems(items);
        } else {
          setMealItems(null);
        }
        
      }, (error) => {
        console.error("Error fetching meal items:", error);
        setMealItems(null);
      });
      
      // Listener for daily meals
      const dailyMealsColRef = doc(db, 'users', user.uid).collection('daily-meals');
      const unsubscribeDailyMeals = onSnapshot(dailyMealsColRef, (querySnapshot) => {
        const meals: DailyMeal[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            meals.push({
                date: data.date,
                breakfast: data.breakfast,
                lunch: data.lunch,
                dinner: data.dinner,
                snack: data.snack,
            });
        });
        // Sort by date string to ensure order
        meals.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setDailyMeals(meals.length > 0 ? meals : null);
        setLoading(false); // Data loaded or confirmed not to exist
      }, (error) => {
        console.error("Error fetching daily meals:", error);
        setDailyMeals(null);
        setLoading(false);
      });
      

      return () => {
        unsubscribeMealItems();
        unsubscribeDailyMeals();
      };
    } else {
       // if no user, we might be signing in, so don't stop loading yet
       // onAuthStateChanged will handle setting user or failing
    }
  }, [user]);

  const value = { user, loading, mealItems, dailyMeals };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
