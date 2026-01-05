'use client';

import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { UtensilsCrossed } from 'lucide-react';
import { useTransition } from 'react';
import { generateNewPlan } from '@/app/actions';
import { useUser } from '@/lib/hooks';
import { useToast } from '@/lib/hooks';
import LoadingSpinner from './loading-spinner';

export default function AppHeader() {
  const [isPending, startTransition] = useTransition();
  const { user } = useUser();
  const { toast } = useToast();

  const handleGenerateNewPlan = () => {
    if (!user) return;
    startTransition(async () => {
      const result = await generateNewPlan(user.uid);
      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      } else {
         toast({
          title: 'Success!',
          description: 'A new 14-day meal plan has been generated.',
        });
      }
    });
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 md:px-6 shrink-0">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />
        <div className="flex items-center gap-2">
            <UtensilsCrossed className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold font-headline">MealGenius</h1>
        </div>
      </div>
      <Button onClick={handleGenerateNewPlan} disabled={isPending}>
        {isPending ? <LoadingSpinner /> : 'Generate New Plan'}
      </Button>
    </header>
  );
}
