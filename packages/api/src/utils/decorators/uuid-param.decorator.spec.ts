/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { readdirSync, readFileSync } from 'fs';
import { join, relative } from 'path';

import { Controller, Get, INestApplication } from '@nestjs/common';
import request from 'supertest';

import { buildTestingMocks } from '@/utils/test/utils';

import { UuidParam } from './uuid-param.decorator';

@Controller('uuid-param-test')
class UuidParamTestController {
  @Get(':id')
  getById(@UuidParam('id') id: string) {
    return { id };
  }
}

const collectControllerFiles = (dir: string): string[] => {
  const entries = readdirSync(dir, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return collectControllerFiles(path);
    }

    return entry.isFile() && entry.name.endsWith('.controller.ts')
      ? [path]
      : [];
  });
};

describe('UuidParam decorator', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const { module } = await buildTestingMocks({
      controllers: [UuidParamTestController],
    });

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects malformed UUID-v4 route params with 404', async () => {
    await request(app.getHttpServer())
      .get('/uuid-param-test/not-a-uuid')
      .expect(404);
  });

  it('accepts valid UUID-v4 route params', async () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    const { body } = await request(app.getHttpServer())
      .get(`/uuid-param-test/${id}`)
      .expect(200);

    expect(body).toEqual({ id });
  });
});

describe('UUID param regression guard', () => {
  it("doesn't use plain @Param for UUID route params in controllers", () => {
    const srcRoot = join(__dirname, '..', '..');
    const controllerFiles = collectControllerFiles(srcRoot);
    const pattern = /@Param\('(id|workflowId|versionId)'/g;
    const offenders = controllerFiles
      .map((file) => {
        const source = readFileSync(file, 'utf8');
        const matches = source.match(pattern);

        return matches?.length
          ? `${relative(srcRoot, file)} (${matches.length})`
          : null;
      })
      .filter(Boolean);

    expect(offenders).toEqual([]);
  });
});
