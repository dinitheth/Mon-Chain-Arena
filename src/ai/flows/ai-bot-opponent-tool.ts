'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating AI bot opponent strategies that dynamically adjust based on player performance.
 *
 * - generateBotStrategy - A function that generates the AI bot strategy.
 * - GenerateBotStrategyInput - The input type for the generateBotStrategy function.
 * - GenerateBotStrategyOutput - The return type for the generateBotStrategy function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateBotStrategyInputSchema = z.object({
  playerPerformance: z
    .string()
    .describe("A description of the player's recent performance, including actions taken and outcomes."),
  roundNumber: z.number().describe('The current round number (1, 2, or 3).'),
});
export type GenerateBotStrategyInput = z.infer<typeof GenerateBotStrategyInputSchema>;

const GenerateBotStrategyOutputSchema = z.object({
  strategy: z
    .string()
    .describe(
      'A detailed strategy for the AI bot, including movement patterns, attack preferences, and defensive tactics.'
    ),
});
export type GenerateBotStrategyOutput = z.infer<typeof GenerateBotStrategyOutputSchema>;

export async function generateBotStrategy(
  input: GenerateBotStrategyInput
): Promise<GenerateBotStrategyOutput> {
  return generateBotStrategyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBotStrategyPrompt',
  input: {schema: GenerateBotStrategyInputSchema},
  output: {schema: GenerateBotStrategyOutputSchema},
  prompt: `You are an expert AI game strategist. You are responsible for creating strategies for bots in the Chain Arena game. The bots need to dynamically adjust their strategies each round based on the player's performance to keep the game challenging and engaging.

Round Number: {{{roundNumber}}}
Player Performance: {{{playerPerformance}}}

Based on the current round number and the player's performance, generate a strategy for the AI bot opponent. Be specific about movement, attack, and defense.

STRATEGY:`, // No Handlebars function calls here, just plain text.
});

const generateBotStrategyFlow = ai.defineFlow(
  {
    name: 'generateBotStrategyFlow',
    inputSchema: GenerateBotStrategyInputSchema,
    outputSchema: GenerateBotStrategyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
