
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
import type { ProductCategory } from '@/lib/types';
import { productCategories } from '@/lib/types';


const SuggestProductCategoryInputSchema = z.object({
  productName: z.string().describe('El nombre del producto.'),
});
export type SuggestProductCategoryInput = z.infer<typeof SuggestProductCategoryInputSchema>;

const SuggestProductCategoryOutputSchema = z.object({
  category: z
    .enum(productCategories as [ProductCategory, ...ProductCategory[]]) // Cast for Zod enum
    .describe('La categoría sugerida para el producto.'),
});
export type SuggestProductCategoryOutput = z.infer<typeof SuggestProductCategoryOutputSchema>;

export async function suggestProductCategory(input: SuggestProductCategoryInput): Promise<SuggestProductCategoryOutput> {
  return suggestProductCategoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestProductCategoryPrompt',
  input: {schema: SuggestProductCategoryInputSchema},
  output: {schema: SuggestProductCategoryOutputSchema},
  prompt: `Dado el nombre del producto "{{{productName}}}", sugiere una categoría de las siguientes opciones: ${productCategories.join(', ')}. Devuelve SOLAMENTE el nombre de la categoría.`,
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
