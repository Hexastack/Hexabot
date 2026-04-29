/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import { ExecArgs } from '@/actions';
import { ActionService } from '@/actions/actions.service';
import { BaseAction } from '@/actions/base-action';
import { deepMerge, isPlainObject } from '@/utils/helpers/object';
import { WorkflowRuntimeContext } from '@/workflow/contexts/workflow-runtime.context';

const slugSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9_]+$/, {
    error: 'slug must contain only lowercase letters, numbers, and underscores',
  });
const updateMemorySchema = z.object({
  memory: z.record(slugSchema, z.any()),
});

type UpdateMemoryInput = z.infer<typeof updateMemorySchema>;
type UpdateMemoryOutput = z.infer<typeof updateMemorySchema>;

@Injectable()
export class UpdateMemoryAction extends BaseAction<
  UpdateMemoryInput,
  UpdateMemoryOutput,
  WorkflowRuntimeContext
> {
  constructor(actionService: ActionService) {
    super(
      {
        name: 'update_memory',
        description:
          'Updates workflow memory for the current subscriber using predefined memory definitions.',
        inputSchema: updateMemorySchema,
        outputSchema: updateMemorySchema,
        group: 'memory',
      },
      actionService,
    );
  }

  async execute({
    input,
    context,
  }: ExecArgs<UpdateMemoryInput, WorkflowRuntimeContext>) {
    const values = Object.fromEntries(
      Object.entries(input.memory).map(([slug, value]) => {
        const currentValue = context.memoryStore.raw[slug];
        if (!isPlainObject(currentValue) || !isPlainObject(value)) {
          return [slug, value];
        }

        return [slug, deepMerge({ ...currentValue }, value)];
      }),
    );
    const memory = await context.memoryStore.update(values);

    return { memory };
  }
}

export default UpdateMemoryAction;
