'use client';

import { useEffect, useState, useTransition } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Plus, UtensilsCrossed, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useFirestore, useToast } from '@/firebase';
import {
  createPlan,
  getStarterMealItems,
  listPlans,
  planExists,
  PlanSummary,
} from '@/lib/plans';
import {
  avatarGradient,
  initialsOf,
  slugifyName,
} from '@/lib/constants';
import type { MealItems } from '@/lib/types';
import { trackEvent } from '@/lib/analytics';
import LoadingSpinner from './loading-spinner';

type Props = {
  onPlanSelected: (plan: { id: string; name: string }) => void;
};

export default function PlanPicker({ onPlanSelected }: Props) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [plans, setPlans] = useState<PlanSummary[] | null>(null);
  const [starter, setStarter] = useState<MealItems | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [all, s] = await Promise.all([
          listPlans(firestore),
          getStarterMealItems(firestore),
        ]);
        if (cancelled) return;
        all.sort((a, b) => (b.lastUpdatedAt ?? 0) - (a.lastUpdatedAt ?? 0));
        setPlans(all);
        setStarter(s);
      } catch (err: any) {
        if (cancelled) return;
        toast({
          title: 'Could not load plans',
          description: err?.message ?? 'Unknown error',
          variant: 'destructive',
        });
        setPlans([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [firestore, toast]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-background via-background to-primary/20" />
      <div className="absolute -z-10 top-1/4 -left-24 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -z-10 bottom-0 right-0 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />

      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-12">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold font-headline">MealPlans</span>
        </div>

        <div className="mt-16 mb-10 text-center">
          <h1 className="font-headline text-5xl font-bold tracking-tight md:text-6xl">
            Who's planning meals?
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Pick your name to open your plan, or start a new one.
          </p>
        </div>

        {plans === null ? (
          <div className="flex flex-1 items-center justify-center">
            <LoadingSpinner className="h-10 w-10" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {plans.map(p => (
              <PlanCard
                key={p.id}
                plan={p}
                onClick={() => onPlanSelected({ id: p.id, name: p.name })}
              />
            ))}
            <NewPlanCard onClick={() => setDialogOpen(true)} />
          </div>
        )}
      </div>

      <NewPlanDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        starter={starter}
        plans={(plans ?? []).filter(p => p.id === 'ditya')}
        onCreated={onPlanSelected}
      />
    </div>
  );
}

function PlanCard({
  plan,
  onClick,
}: {
  plan: PlanSummary;
  onClick: () => void;
}) {
  const gradient = avatarGradient(plan.name);
  const initials = initialsOf(plan.name);
  const updated = plan.lastUpdatedAt
    ? formatDistanceToNow(new Date(plan.lastUpdatedAt), { addSuffix: true })
    : null;

  return (
    <button
      onClick={onClick}
      className="group relative flex aspect-[3/4] flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg"
    >
      <div
        className={`flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-2xl font-bold text-white shadow-md ring-4 ring-background transition-transform group-hover:scale-105`}
      >
        {initials}
      </div>
      <div className="text-center">
        <div className="font-headline text-base font-semibold leading-tight">{plan.name}</div>
        {updated && (
          <div className="mt-1 text-xs text-muted-foreground">{updated}</div>
        )}
      </div>
    </button>
  );
}

function NewPlanCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex aspect-[3/4] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-4 transition-all hover:-translate-y-1 hover:border-primary hover:bg-primary/10"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20 text-primary transition-transform group-hover:scale-105">
        <Plus className="h-8 w-8" />
      </div>
      <div className="font-headline text-base font-semibold text-primary">New plan</div>
    </button>
  );
}

function NewPlanDialog({
  open,
  onOpenChange,
  starter,
  plans,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  starter: MealItems | null;
  plans: PlanSummary[];
  onCreated: (plan: { id: string; name: string }) => void;
}) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [name, setName] = useState('');
  // seedFrom: 'none' = empty plan, 'starter' = built-in starter/legacy, or a specific plan id
  const defaultSeed = starter ? 'starter' : plans[0]?.id ?? 'none';
  const [seedFrom, setSeedFrom] = useState<string>(defaultSeed);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      setName('');
      setSeedFrom(starter ? 'starter' : plans[0]?.id ?? 'none');
    }
  }, [open, starter, plans]);

  const slug = slugifyName(name);
  const starterCounts = starter
    ? {
        breakfast: starter.breakfast?.length ?? 0,
        lunch: starter.lunch?.length ?? 0,
        dinner: starter.dinner?.length ?? 0,
        snack: starter.snack?.length ?? 0,
      }
    : null;

  const handleSubmit = async () => {
    if (!slug) return;
    startTransition(async () => {
      try {
        if (await planExists(firestore, slug)) {
          toast({
            title: `A plan named "${name}" already exists`,
            description: 'Pick it from the list on the landing page, or try a different name.',
            variant: 'destructive',
          });
          return;
        }
        const summary = await createPlan({
          firestore,
          name: name.trim(),
          seedFrom: seedFrom === 'none' ? null : seedFrom,
        });
        trackEvent('plan_created', {
          seededFrom: seedFrom === 'none' ? 'none' : seedFrom === 'starter' ? 'starter' : 'plan',
        });
        onOpenChange(false);
        onCreated({ id: summary.id, name: summary.name });
      } catch (err: any) {
        toast({
          title: 'Could not create plan',
          description: err?.message ?? 'Unknown error',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Start a new plan</DialogTitle>
          <DialogDescription>
            Your name becomes the label for this meal plan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium">Your name</label>
            <Input
              autoFocus
              placeholder="e.g. Priya"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && slug && !isPending) handleSubmit();
              }}
              className="mt-1"
              maxLength={40}
            />
          </div>

          <div className="rounded-xl border bg-muted/40 p-4 space-y-2.5">
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-accent" />
              Copy meal items from
            </div>

            <div className="space-y-1.5">
              {starter && (
                <SourceOption
                  checked={seedFrom === 'starter'}
                  onSelect={() => setSeedFrom('starter')}
                  label="Starter template"
                  hint={
                    starterCounts
                      ? `${starterCounts.breakfast} breakfasts · ${starterCounts.lunch} lunches · ${starterCounts.dinner} dinners · ${starterCounts.snack} snacks`
                      : undefined
                  }
                />
              )}
              {plans.map(p => (
                <SourceOption
                  key={p.id}
                  checked={seedFrom === p.id}
                  onSelect={() => setSeedFrom(p.id)}
                  label={`${p.name}'s plan`}
                  hint="Copy their meal items"
                />
              ))}
              <SourceOption
                checked={seedFrom === 'none'}
                onSelect={() => setSeedFrom('none')}
                label="Start empty"
                hint="Enter meals manually on the next screen"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!slug || isPending}>
            {isPending ? (
              <LoadingSpinner className="h-4 w-4" />
            ) : (
              <>
                Continue <ArrowRight className="ml-1.5 h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SourceOption({
  checked,
  onSelect,
  label,
  hint,
}: {
  checked: boolean;
  onSelect: () => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-start gap-3 rounded-lg border p-2.5 text-left transition ${
        checked
          ? 'border-primary bg-primary/10'
          : 'border-transparent hover:border-border hover:bg-background/60'
      }`}
    >
      <span
        className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border ${
          checked ? 'border-primary bg-primary' : 'border-muted-foreground/40'
        }`}
      >
        {checked && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
      </span>
      <span className="flex-1">
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>}
      </span>
    </button>
  );
}
