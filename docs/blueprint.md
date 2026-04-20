# **App Name**: MealPlans

## Core Features:

- Anonymous User Authentication: Authenticate users anonymously using Firebase Authentication.
- Meal Item Management: Allow users to view, add, and remove meal items (Breakfast, Lunch, Dinner, Snacks).
- Initial Meal Preferences Form: Present a full-page form for new users to input initial lists of favorite meals.
- AI Meal Plan Generation: Use Genkit's 'suggestNewMealPlan' flow (Gemini latest) to generate a 14-day meal plan based on meal preferences.  The LLM will use a tool to assist in determining when the plan contains an appropriate number of calories and nutritional diversity.
- Meal Plan Display: Display the generated 14-day meal plan in a responsive grid with tabs for "Week 1" and "Week 2". Highlight the current day.
- AI Meal Suggestion: Use Genkit's 'updateSingleMeal' flow to suggest a different meal using an AI tool.  The AI tool is a mechanism the LLM can leverage at its discretion to provide meal plans that satisfy a variety of requirements or conditions.
- Manual Meal Replacement: Allow users to manually select a different meal from their list using a dropdown/selector.
- Firestore Integration: Store and manage user data, meal lists, and meal plans in Cloud Firestore, using collections like 'users', 'data/meal-items', and 'daily-meals'.

## Style Guidelines:

- Primary color: Pleasant green (#6ab04c), aligning with food and freshness.
- Background color: Dark, desaturated green (#263223), suitable for a dark theme.
- Accent color: Teal (#4db6ac), providing contrast and highlighting interactive elements.
- Headline font: 'Playfair', a serif font with an elegant feel.
- Body font: 'PT Sans', a sans-serif font for readability.
- Use relevant icons from ShadCN UI for meal categories and actions, ensuring clarity and visual appeal.
- Implement a responsive sidebar layout with a collapsible sidebar for meal management. Use ShadCN UI components to maintain a consistent, modern design.
- Incorporate loading indicators (spinners) during asynchronous operations such as generating meal plans or refreshing meals.