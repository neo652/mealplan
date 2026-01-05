'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2 } from 'lucide-react';
import { useUser, useToast } from '@/firebase';
import { MealIcons } from '@/components/icons';
import { FormEvent, useState, useTransition } from 'react';
import { updateMealItem } from '@/app/actions';
import LoadingSpinner from './loading-spinner';
import { SidebarHeader, SidebarContent, SidebarFooter } from './ui/sidebar';
import type { MealCategory, MealItems } from '@/lib/types';
import { MEAL_CATEGORIES } from '@/lib/constants';

interface SidebarContentComponentProps {
  mealItems: MealItems | null;
}

export default function SidebarContentComponent({ mealItems }: SidebarContentComponentProps) {
  const { user } = useUser();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [newItems, setNewItems] = useState({
    breakfast: '',
    lunch: '',
    dinner: '',
    snack: '',
  });

  const handleAddItem = (category: MealCategory) => {
    const newItem = newItems[category].trim();
    if (!newItem || !mealItems || !user) return;

    const currentItems = mealItems[category] || [];
    if (currentItems.includes(newItem)) {
        toast({ title: 'Item already exists', variant: 'destructive' });
        return;
    }

    startTransition(async () => {
      const result = await updateMealItem(user.uid, category, [...currentItems, newItem]);
      if (result?.error) {
        toast({ title: 'Error adding item', description: result.error, variant: 'destructive' });
      } else {
        setNewItems(prev => ({...prev, [category]: ''}));
      }
    });
  };
  
  const handleRemoveItem = (category: MealCategory, itemToRemove: string) => {
    if (!mealItems || !user) return;
    const updatedItems = (mealItems[category] || []).filter(item => item !== itemToRemove);
    startTransition(async () => {
      const result = await updateMealItem(user.uid, category, updatedItems);
      if (result?.error) {
        toast({ title: 'Error removing item', description: result.error, variant: 'destructive' });
      }
    });
  }

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>, category: MealCategory) => {
    e.preventDefault();
    handleAddItem(category);
  }

  return (
    <>
      <SidebarHeader>
        <h2 className="text-lg font-semibold font-headline">Your Meal Lists</h2>
      </SidebarHeader>
      <SidebarContent>
        <ScrollArea className="h-full">
          <Accordion type="multiple" defaultValue={MEAL_CATEGORIES} className="w-full px-2">
            {MEAL_CATEGORIES.map((category) => {
                const Icon = MealIcons[category as MealCategory];
                return (
              <AccordionItem value={category} key={category}>
                <AccordionTrigger className="text-base font-headline capitalize">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {category}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <form onSubmit={(e) => handleFormSubmit(e, category as MealCategory)} className="flex gap-2">
                      <Input 
                        placeholder="Add new item..." 
                        value={newItems[category as MealCategory]}
                        onChange={(e) => setNewItems(prev => ({...prev, [category]: e.target.value }))}
                      />
                      <Button type="submit" size="icon" className="flex-shrink-0" disabled={isPending}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </form>
                    <div className="space-y-1">
                      {mealItems && mealItems[category as MealCategory]?.map(item => (
                        <div key={item} className="flex items-center justify-between text-sm p-2 rounded-md bg-sidebar-accent/50">
                          <span>{item}</span>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveItem(category as MealCategory, item)} disabled={isPending}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                       {isPending && <div className="flex justify-center p-2"><LoadingSpinner/></div>}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )})}
          </Accordion>
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter>
        <p className="text-xs text-muted-foreground p-2">Manage your favorite meals here.</p>
      </SidebarFooter>
    </>
  );
}
