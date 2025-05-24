// use server'

/**
 * @fileOverview Provides AI-driven category suggestions for products.
 *
 * - suggestProductCategory - A function that suggests a product category based on the product name.
 * - SuggestProductCategoryInput - The input type for the suggestProductCategory function.
 * - SuggestProductCategoryOutput - The return type for the suggestProductCategory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestProductCategoryInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
});
export type SuggestProductCategoryInput = z.infer<typeof SuggestProductCategoryInputSchema>;

const SuggestProductCategoryOutputSchema = z.object({
  category: z
    .enum(['Drinks', 'Food', 'Merchandise'])
    .describe('The suggested category for the product.'),
});
export type SuggestProductCategoryOutput = z.infer<typeof SuggestProductCategoryOutputSchema>;

export async function suggestProductCategory(input: SuggestProductCategoryInput): Promise<SuggestProductCategoryOutput> {
  return suggestProductCategoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestProductCategoryPrompt',
  input: {schema: SuggestProductCategoryInputSchema},
  output: {schema: SuggestProductCategoryOutputSchema},
  prompt: `Given the product name "{{{productName}}}", suggest a category from the following options: Drinks, Food, Merchandise. Return ONLY the name of the category.`,
});

const suggestProductCategoryFlow = ai.defineFlow(
  {
    name: 'suggestProductCategoryFlow',
    inputSchema: SuggestProductCategoryInputSchema,
    outputSchema: SuggestProductCategoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
