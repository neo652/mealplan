import {
  Firestore,
  doc,
  getDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { LEGACY_APP_OWNER_UID, STARTER_PLAN_ID, slugifyName } from './constants';
import type { MealItems } from './types';

export type PlanSummary = {
  id: string;
  name: string;
  lastUpdatedAt?: number;
};

export type PlansIndex = {
  plans: PlanSummary[];
};

export function planDocPath(planId: string) {
  return `plans/${planId}`;
}

export function planMealItemsPath(planId: string) {
  return `plans/${planId}/data/meal-items`;
}

export function planDailyMealPath(planId: string, dayId: string) {
  return `plans/${planId}/daily-meals/${dayId}`;
}

export function plansIndexPath() {
  return `plans-index/all`;
}

export async function listPlans(firestore: Firestore): Promise<PlanSummary[]> {
  const snap = await getDoc(doc(firestore, plansIndexPath()));
  if (!snap.exists()) return [];
  const data = snap.data() as PlansIndex | undefined;
  return (data?.plans ?? []).filter(p => p.id !== STARTER_PLAN_ID);
}

/**
 * Returns meal items from the given plan, or null if missing.
 */
export async function getPlanMealItems(firestore: Firestore, planId: string): Promise<MealItems | null> {
  try {
    const snap = await getDoc(doc(firestore, planMealItemsPath(planId)));
    if (snap.exists()) return snap.data() as MealItems;
  } catch {
    // permission or network error — ignore
  }
  return null;
}

/**
 * Returns meal items to seed new plans from, trying (in order):
 *   1. /plans/_starter
 *   2. Legacy /users/{LEGACY_APP_OWNER_UID}/data/meal-items
 *   3. The most recently updated existing plan
 */
export async function getStarterMealItems(firestore: Firestore): Promise<MealItems | null> {
  try {
    const starter = await getDoc(doc(firestore, planMealItemsPath(STARTER_PLAN_ID)));
    if (starter.exists()) return starter.data() as MealItems;
  } catch {}

  try {
    const legacy = await getDoc(
      doc(firestore, 'users', LEGACY_APP_OWNER_UID, 'data', 'meal-items'),
    );
    if (legacy.exists()) return legacy.data() as MealItems;
  } catch {}

  try {
    const plans = await listPlans(firestore);
    if (plans.length > 0) {
      const newest = [...plans].sort((a, b) => (b.lastUpdatedAt ?? 0) - (a.lastUpdatedAt ?? 0))[0];
      return await getPlanMealItems(firestore, newest.id);
    }
  } catch {}

  return null;
}

export async function planExists(firestore: Firestore, planId: string): Promise<boolean> {
  const snap = await getDoc(doc(firestore, planDocPath(planId)));
  return snap.exists();
}

export type CreatePlanArgs = {
  firestore: Firestore;
  name: string;
  /** Source to copy meal items from: a plan id, 'starter', or null for empty. */
  seedFrom: string | null;
};

export async function createPlan({ firestore, name, seedFrom }: CreatePlanArgs): Promise<PlanSummary> {
  const id = slugifyName(name);
  if (!id) throw new Error('Please enter a valid name.');

  const now = Date.now();
  const batch = writeBatch(firestore);

  batch.set(doc(firestore, planDocPath(id)), {
    id,
    name,
    createdAt: serverTimestamp(),
    lastUpdatedAt: serverTimestamp(),
  });

  if (seedFrom) {
    let source: MealItems | null = null;
    if (seedFrom === 'starter') {
      source = await getStarterMealItems(firestore);
    } else {
      source = await getPlanMealItems(firestore, seedFrom);
    }
    if (source) {
      const { planStartDate: _ignore, ...items } = source as MealItems & { planStartDate?: string };
      batch.set(doc(firestore, planMealItemsPath(id)), items);
    }
  }

  // Update index
  const indexRef = doc(firestore, plansIndexPath());
  const indexSnap = await getDoc(indexRef);
  const existing = (indexSnap.exists() ? (indexSnap.data() as PlansIndex).plans : []) || [];
  const filtered = existing.filter(p => p.id !== id);
  const summary: PlanSummary = { id, name, lastUpdatedAt: now };
  batch.set(indexRef, { plans: [...filtered, summary] });

  await batch.commit();
  return summary;
}

export async function touchPlan(firestore: Firestore, planId: string, name?: string): Promise<void> {
  const indexRef = doc(firestore, plansIndexPath());
  const indexSnap = await getDoc(indexRef);
  const existing = (indexSnap.exists() ? (indexSnap.data() as PlansIndex).plans : []) || [];
  const now = Date.now();
  const filtered = existing.filter(p => p.id !== planId);
  const resolvedName = name ?? existing.find(p => p.id === planId)?.name ?? planId;
  const batch = writeBatch(firestore);
  batch.set(indexRef, { plans: [...filtered, { id: planId, name: resolvedName, lastUpdatedAt: now }] });
  batch.set(doc(firestore, planDocPath(planId)), { lastUpdatedAt: serverTimestamp() }, { merge: true });
  await batch.commit();
}
