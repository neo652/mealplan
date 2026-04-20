'use client';

import { track } from '@vercel/analytics';

export type AnalyticsEvent =
  | { name: 'plan_created'; props: { seededFrom: 'starter' | 'plan' | 'none' } }
  | { name: 'plan_generated'; props: { source: 'header' | 'empty_state' | 'initial_setup' } }
  | { name: 'meal_swapped'; props: { category: string; method: 'shuffle' | 'pick' } }
  | { name: 'plan_switched'; props: Record<string, never> };

export function trackEvent<E extends AnalyticsEvent>(event: E['name'], props?: E['props']): void {
  try {
    track(event, (props ?? {}) as Record<string, string | number | boolean | null>);
  } catch {
    // analytics failures must never break the UI
  }
}
