import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';

import { validateWorkflow } from '../dsl.types';

const fixturePath = path.join(__dirname, '..',  '..', 'example', 'workflow.yml');
const fixtureYaml = fs.readFileSync(fixturePath, 'utf8');

describe('validateWorkflow', () => {
  it('accepts the reference workflow example', () => {
    const result = validateWorkflow(fixtureYaml);

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.workflow.name).toBe('research_and_reply');
      expect(Object.keys(result.data.tasks)).toContain('understand_request');
      expect(result.data.flow.length).toBeGreaterThan(0);
    }
  });

  it('fails when flow references unknown tasks', () => {
    const parsed = parseYaml(fixtureYaml) as Record<string, unknown>;
    parsed.flow = [{ do: 'non_existent_task' }];

    const result = validateWorkflow(parsed);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0]).toMatch(/non_existent_task/);
    }
  });

  it('fails schema validation when expressions are malformed', () => {
    const parsed = parseYaml(fixtureYaml) as Record<string, unknown>;
    parsed.flow = [
      {
        conditional: {
          when: [
            {
              condition: 'missing-equals-prefix',
              steps: [{ do: 'understand_request' }],
            },
          ],
        },
      },
    ];

    const result = validateWorkflow(parsed);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((err) => err.includes('Expression strings'))).toBe(true);
    }
  });
});
