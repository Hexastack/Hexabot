/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { FlowStep, WorkflowDefinition } from '../dsl.types';
import {
  getValueAtPath,
  insertStepAtPath,
  removeStepAtPath,
  setValueAtPath,
  type FlowStepPath,
} from '../workflow-definition-path';

const createDefinition = (): WorkflowDefinition => ({
  workflow: { name: 'Test Workflow', version: '1.0.0' },
  tasks: {
    task_one: { action: 'noop' },
    task_two: { action: 'noop' },
    task_three: { action: 'noop' },
    task_four: { action: 'noop' },
    task_five: { action: 'noop' },
    task_six: { action: 'noop' },
  },
  flow: [
    { do: 'task_one' },
    { parallel: { steps: [{ do: 'task_two' }, { do: 'task_three' }] } },
    {
      conditional: {
        when: [
          { condition: '=true', steps: [{ do: 'task_four' }] },
          { else: true, steps: [{ do: 'task_five' }] },
        ],
      },
    },
  ],
  outputs: { done: '=true' },
});
const getParallelSteps = (definition: WorkflowDefinition) =>
  (definition.flow[1] as { parallel: { steps: FlowStep[] } }).parallel.steps;

describe('workflow definition path helpers', () => {
  describe('getValueAtPath', () => {
    it('returns nested values for object and array paths', () => {
      const definition = createDefinition();
      const path: FlowStepPath = ['flow', 1, 'parallel', 'steps', 0, 'do'];

      expect(getValueAtPath(definition, path)).toBe('task_two');
    });

    it('returns the root value for an empty path', () => {
      const definition = createDefinition();

      expect(getValueAtPath(definition, [])).toBe(definition);
    });

    it('returns undefined for invalid array keys or nullish branches', () => {
      const definition = createDefinition();

      expect(getValueAtPath(definition, ['flow', '1'])).toBeUndefined();
      expect(getValueAtPath({ flow: null }, ['flow', 0])).toBeUndefined();
    });

    it('stringifies object keys when walking paths', () => {
      const value = { 0: { label: 'zero' } };

      expect(getValueAtPath(value, [0, 'label'])).toBe('zero');
    });
  });

  describe('setValueAtPath', () => {
    it('updates nested object values immutably', () => {
      const definition = createDefinition();
      const updated = setValueAtPath(
        definition,
        ['workflow', 'name'],
        'Updated Workflow',
      );

      expect(updated).not.toBe(definition);
      expect(updated.workflow.name).toBe('Updated Workflow');
      expect(updated.flow).toBe(definition.flow);
    });

    it('updates array elements immutably', () => {
      const steps: FlowStep[] = [{ do: 'task_one' }, { do: 'task_two' }];
      const updated = setValueAtPath(steps, [1, 'do'], 'task_three');

      expect(updated).not.toBe(steps);
      expect((updated as FlowStep[])[1]).toEqual({ do: 'task_three' });
      expect(steps[1]).toEqual({ do: 'task_two' });
    });

    it('returns the original value for invalid array keys or non-objects', () => {
      const steps: FlowStep[] = [{ do: 'task_one' }];
      const unchanged = setValueAtPath(steps, ['0'], { do: 'task_two' });

      expect(unchanged).toBe(steps);
      expect(setValueAtPath('value', ['next'], 'updated')).toBe('value');
    });
  });

  describe('removeStepAtPath', () => {
    it('removes a step at the provided path', () => {
      const definition = createDefinition();
      const updated = removeStepAtPath(definition, ['flow', 1]);

      expect(updated).not.toBeNull();
      const nextDefinition = updated as WorkflowDefinition;

      expect(nextDefinition.flow).toHaveLength(2);
      expect(nextDefinition.flow[1]).toEqual(definition.flow[2]);
      expect(definition.flow).toHaveLength(3);
    });

    it('removes a nested step in a parallel block', () => {
      const definition = createDefinition();
      const updated = removeStepAtPath(definition, [
        'flow',
        1,
        'parallel',
        'steps',
        0,
      ]);

      expect(updated).not.toBeNull();
      const nextDefinition = updated as WorkflowDefinition;
      const steps = getParallelSteps(nextDefinition);

      expect(steps).toHaveLength(1);
      expect(steps[0]).toEqual({ do: 'task_three' });
    });

    it('returns null for invalid paths', () => {
      const definition = createDefinition();

      expect(removeStepAtPath(definition, [])).toBeNull();
      expect(removeStepAtPath(definition, ['flow', '1'])).toBeNull();
      expect(removeStepAtPath(definition, ['workflow', 'name', 0])).toBeNull();
      expect(removeStepAtPath(definition, ['flow', 99])).toBeNull();
    });
  });

  describe('insertStepAtPath', () => {
    it('inserts a step at the provided path', () => {
      const definition = createDefinition();
      const step: FlowStep = { do: 'task_six' };
      const updated = insertStepAtPath(definition, ['flow', 1], step);

      expect(updated).not.toBeNull();
      const nextDefinition = updated as WorkflowDefinition;

      expect(nextDefinition.flow).toHaveLength(4);
      expect(nextDefinition.flow[1]).toEqual(step);
      expect(definition.flow).toHaveLength(3);
    });

    it('clamps insertion indices to array bounds', () => {
      const definition = createDefinition();
      const step: FlowStep = { do: 'task_six' };
      const insertAtStart = insertStepAtPath(definition, ['flow', -2], step);
      const insertAtEnd = insertStepAtPath(definition, ['flow', 99], step);

      expect(insertAtStart).not.toBeNull();
      expect((insertAtStart as WorkflowDefinition).flow[0]).toEqual(step);

      expect(insertAtEnd).not.toBeNull();
      const endDefinition = insertAtEnd as WorkflowDefinition;
      expect(endDefinition.flow[endDefinition.flow.length - 1]).toEqual(step);
    });

    it('inserts a step into a nested array', () => {
      const definition = createDefinition();
      const step: FlowStep = { do: 'task_six' };
      const updated = insertStepAtPath(
        definition,
        ['flow', 1, 'parallel', 'steps', 1],
        step,
      );

      expect(updated).not.toBeNull();
      const nextDefinition = updated as WorkflowDefinition;
      const steps = getParallelSteps(nextDefinition);

      expect(steps).toEqual([{ do: 'task_two' }, step, { do: 'task_three' }]);
    });

    it('returns null for invalid paths', () => {
      const definition = createDefinition();
      const step: FlowStep = { do: 'task_six' };

      expect(insertStepAtPath(definition, [], step)).toBeNull();
      expect(insertStepAtPath(definition, ['flow', '1'], step)).toBeNull();
      expect(
        insertStepAtPath(definition, ['workflow', 'name', 0], step),
      ).toBeNull();
    });
  });
});
