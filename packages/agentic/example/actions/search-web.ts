import { z } from 'zod';

import { defineAction } from '../../src';
import { SettingsSchema } from '../../src/dsl.types';
import type { ExampleContext } from '../context';

const inputSchema = z.object({
  query: z.string(),
  limit: z.number().int().positive().optional(),
});

const outputSchema = z.object({
  links: z.array(z.string()),
  snippets: z.array(z.string()),
});

const settingsSchema = SettingsSchema;

type SearchWebInput = z.infer<typeof inputSchema>;
type SearchWebOutput = z.infer<typeof outputSchema>;
type SearchWebSettings = z.infer<typeof settingsSchema>;

export const searchWeb = defineAction<SearchWebInput, SearchWebOutput, ExampleContext, SearchWebSettings>({
  name: 'search_web',
  description: 'Stubbed web search returning predictable links for the demo.',
  inputSchema,
  outputSchema,
  settingSchema: settingsSchema,
  execute: async ({ input, context }) => {
    const limit = input.limit ?? 3;
    context.log('Searching web', { query: input.query, limit });

    const snippets = Array.from({ length: limit }, (_, index) =>
      `Result ${index + 1} about ${input.query}`,
    );
    const links = snippets.map((snippet, index) => `https://example.com/${index + 1}?q=${encodeURIComponent(input.query)}`);

    return { links, snippets };
  },
});
