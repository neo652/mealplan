export const MEAL_CATEGORIES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

export const LEGACY_APP_OWNER_UID = 'rP07763S2bNDtZcxoAaBnbyEvs92';
export const STARTER_PLAN_ID = '_starter';
export const PLANS_INDEX_DOC = 'plans-index/all';
export const LOCAL_STORAGE_PLAN_KEY = 'mealgenius.currentPlanId';

export function slugifyName(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

const AVATAR_PALETTE = [
  'from-emerald-500 to-teal-600',
  'from-sky-500 to-indigo-600',
  'from-fuchsia-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-red-600',
  'from-violet-500 to-purple-600',
  'from-lime-500 to-green-600',
  'from-cyan-500 to-blue-600',
];

export function avatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
