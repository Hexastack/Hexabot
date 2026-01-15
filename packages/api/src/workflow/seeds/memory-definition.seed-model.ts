/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { MemoryDefinitionCreateDto } from '../dto/memory-definition.dto';
import { MemoryScope } from '../types';

export const memoryDefinitionModels: MemoryDefinitionCreateDto[] = [
  {
    name: 'General Chatbot — Minimal User Memory',
    slug: 'general_user_memory',
    scope: MemoryScope.global,
    schema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      title: 'General Chatbot — Minimal User Memory',
      description:
        'Small, user-consented profile + preferences that improve UX across all flows.',
      type: 'object',
      additionalProperties: false,
      properties: {
        preferredName: {
          type: 'string',
          minLength: 1,
          maxLength: 80,
          description: 'How the user wants to be addressed.',
        },
        style: {
          type: 'object',
          additionalProperties: false,
          properties: {
            tone: {
              type: 'string',
              enum: ['neutral', 'friendly', 'professional'],
              default: 'neutral',
            },
            verbosity: {
              type: 'string',
              enum: ['concise', 'balanced', 'detailed'],
              default: 'balanced',
            },
            format: {
              type: 'string',
              enum: ['auto', 'bullets', 'steps'],
              default: 'auto',
            },
          },
        },
        summary: {
          type: 'string',
          maxLength: 500,
          description:
            '1–2 sentences of stable context the user wants remembered.',
        },
      },
    },
  },
];
