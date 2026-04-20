# MealPlans

A simple, household-friendly meal planner. Pick who's cooking, and get a 14-day plan assembled from that person's own pantry of breakfasts, lunches, dinners, and snacks. Swap individual meals, shuffle a category with "Surprise me," or regenerate the whole plan in one click.

**Live app:** https://mealplan-ai.vercel.app/

## How it works

- **No login** — pick your name from the landing page to open your plan, or create a new one. Your selection persists on the device.
- **Per-person plans** — each name is its own isolated plan in Firestore (`/plans/{planId}`). Meal items, daily meals, and "Generate new plan" are all scoped to the active person.
- **Starter template** — new plans can be seeded by copying meal items from Ditya's existing plan (or start empty and set them up manually).
- **Today hero + full grid** — the dashboard opens on today's meals front-and-center, with the rest of the 14 days in Week 1 / Week 2 tabs below.

## Tech stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS + shadcn/ui (Radix primitives)
- Firebase Auth (anonymous) + Cloud Firestore
- Deployed on Vercel

## Data model

```
/plans/{planId}                 # planId = slugified display name
  ├── name, createdAt, lastUpdatedAt
  ├── /data/meal-items          # { breakfast[], lunch[], dinner[], snack[], planStartDate }
  └── /daily-meals/{dayId}      # { date, breakfast, lunch, dinner, snack }

/plans-index/all                # { plans: [{ id, name, lastUpdatedAt }] } — powers the landing picker
```

Anonymous Firebase Auth signs every visitor in so Firestore rules can require `auth != null`. Trust is household-level: any signed-in client can read/write any plan. Don't put secrets in meal names.

## Local development

```bash
npm install
npm run dev            # http://localhost:9002
npm run typecheck
npm run lint
```

Firestore rules live in [firestore.rules](firestore.rules) and are deployed separately:

```bash
firebase deploy --only firestore:rules
```

## Project layout

- [src/app](src/app) — Next.js App Router entry (`layout.tsx`, `page.tsx`)
- [src/components/plan-picker.tsx](src/components/plan-picker.tsx) — landing page name picker and "New plan" dialog
- [src/components/dashboard.tsx](src/components/dashboard.tsx) — main app shell (sidebar + header + hero + grid)
- [src/components/today-hero.tsx](src/components/today-hero.tsx) — hero card for today's meals
- [src/components/meal-item.tsx](src/components/meal-item.tsx) — per-meal swap picker ("Surprise me" + search)
- [src/lib/plans.ts](src/lib/plans.ts) — Firestore helpers for creating, listing, and seeding plans
- [src/hooks/use-current-plan.ts](src/hooks/use-current-plan.ts) — localStorage-backed current-plan selection
- [firestore.rules](firestore.rules) — security rules
