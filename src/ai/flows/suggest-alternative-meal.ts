'use server';

/**
 * @fileOverview A flow for suggesting an alternative meal from a user's preferred list.
 *
 * - updateSingleMeal - A function that suggests a different meal.
 * - UpdateSingleMealInput - The input type for the updateSingleMeal function.
 * - UpdateSingleMealOutput - The return type for the updateSingleMeal function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const UpdateSingleMealInputSchema = z.object({
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).describe('The type of the meal to update.'),
  availableMeals: z.array(z.string()).describe('The list of available meals for the specified meal type.'),
  currentMeal: z.string().describe('The currently assigned meal.'),
});
export type UpdateSingleMealInput = z.infer<typeof UpdateSingleMealInputSchema>;

const UpdateSingleMealOutputSchema = z.object({
  suggestedMeal: z.string().describe('A suggested alternative meal.'),
});
export type UpdateSingleMealOutput = z.infer<typeof UpdateSingleMealOutputSchema>;

export async function updateSingleMeal(input: UpdateSingleMealInput): Promise<UpdateSingleMealOutput> {
  return updateSingleMealFlow(input);
}

const prompt = ai.definePrompt({
  name: 'updateSingleMealPrompt',
  input: {schema: UpdateSingleMealInputSchema},
  output: {schema: UpdateSingleMealOutputSchema},
  prompt: `Given the current meal and a list of available meals for the specified meal type, suggest a different meal.

Meal Type: {{{mealType}}}
Current Meal: {{{currentMeal}}}
Available Meals: {{#each availableMeals}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Suggest a different meal from the available meals list:`,
});

const updateSingleMealFlow = ai.defineFlow(
  {
    name: 'updateSingleMealFlow',
    inputSchema: UpdateSingleMealInputSchema,
    outputSchema: UpdateSingleMealOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
