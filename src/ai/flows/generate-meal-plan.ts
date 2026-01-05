'use server';

/**
 * @fileOverview A meal plan generation AI agent.
 *
 * - suggestNewMealPlan - A function that handles the meal plan generation process.
 * - SuggestNewMealPlanInput - The input type for the suggestNewMealPlan function.
 * - SuggestNewMealPlanOutput - The return type for the suggestNewMealPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestNewMealPlanInputSchema = z.object({
  breakfastItems: z.array(z.string()).describe('List of breakfast items.'),
  lunchItems: z.array(z.string()).describe('List of lunch items.'),
  dinnerItems: z.array(z.string()).describe('List of dinner items.'),
  snackItems: z.array(z.string()).describe('List of snack items.'),
});
export type SuggestNewMealPlanInput = z.infer<typeof SuggestNewMealPlanInputSchema>;

const DailyMealSchema = z.object({
  breakfast: z.string().describe('Breakfast item for the day.'),
  lunch: z.string().describe('Lunch item for the day.'),
  dinner: z.string().describe('Dinner item for the day.'),
  snack: z.string().describe('Snack item for the day.'),
});

const SuggestNewMealPlanOutputSchema = z.array(DailyMealSchema).length(14).describe('A 14-day meal plan.');
export type SuggestNewMealPlanOutput = z.infer<typeof SuggestNewMealPlanOutputSchema>;


export async function suggestNewMealPlan(input: SuggestNewMealPlanInput): Promise<SuggestNewMealPlanOutput> {
  return suggestNewMealPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestNewMealPlanPrompt',
  input: {schema: SuggestNewMealPlanInputSchema},
  output: {schema: SuggestNewMealPlanOutputSchema},
  prompt: `You are a personal meal planning assistant. Generate a 14-day meal plan for the user based on their preferred meals.

  The meal plan should:
  - Include one item from each category (breakfast, lunch, dinner, snack) for each day.
  - Be somewhat diverse, and avoid repeating the same meal too frequently.

  Here are the user's preferred meals:
  Breakfast: {{#each breakfastItems}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  Lunch: {{#each lunchItems}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  Dinner: {{#each dinnerItems}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  Snack: {{#each snackItems}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

  Return a JSON array containing 14 objects, each representing a day in the meal plan. Each object should have keys for breakfast, lunch, dinner, and snack.
  Ensure the output is a valid JSON array that satisfies the specified SuggestNewMealPlanOutputSchema.
  `, 
});

const suggestNewMealPlanFlow = ai.defineFlow(
  {
    name: 'suggestNewMealPlanFlow',
    inputSchema: SuggestNewMealPlanInputSchema,
    outputSchema: SuggestNewMealPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
