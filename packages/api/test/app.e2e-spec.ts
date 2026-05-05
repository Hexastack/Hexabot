/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { McpTokenService } from '@/mcp/services/mcp-token.service';
import { ModelService } from '@/user/services/model.service';
import { PermissionService } from '@/user/services/permission.service';
import { RoleService } from '@/user/services/role.service';
import { UserService } from '@/user/services/user.service';
import { Action } from '@/user/types/action.type';
import { buildTestingMocks } from '@/utils/test/utils';

import { HexabotApplicationModule } from './../src/app.module';

const mcpDescribe =
  process.env.MCP_ENABLED === 'true' ? describe : describe.skip;

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let module: TestingModule;

  beforeEach(async () => {
    const testing = await buildTestingMocks({
      imports: [HexabotApplicationModule],
    });

    module = testing.module;
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    await module.close();
  });

  it('/api/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect('OK');
  });

  mcpDescribe('MCP endpoints', () => {
    it('/api/mcp rejects unauthenticated requests', () => {
      return request(app.getHttpServer())
        .post('/api/mcp')
        .set('Accept', 'application/json, text/event-stream')
        .send({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2025-06-18',
            capabilities: {},
            clientInfo: { name: 'e2e', version: '1.0.0' },
          },
        })
        .expect(401);
    });

    it('accepts an authorized MCP tool call with a Hexabot MCP token', async () => {
      const roleService = module.get(RoleService);
      const modelService = module.get(ModelService);
      const permissionService = module.get(PermissionService);
      const userService = module.get(UserService);
      const mcpTokenService = module.get(McpTokenService);
      const role =
        (await roleService.findOne({ where: { name: 'mcp-e2e' } })) ??
        (await roleService.create({
          name: 'mcp-e2e',
          active: true,
        }));
      const workflowModel =
        (await modelService.findOne({ where: { identity: 'workflow' } })) ??
        (await modelService.create({
          name: 'Workflow',
          identity: 'workflow',
          attributes: {},
        }));
      const existingPermission = await permissionService.findOne({
        where: {
          role: { id: role.id },
          model: { id: workflowModel.id },
          action: Action.READ,
          relation: null,
        } as any,
      });
      if (!existingPermission) {
        await permissionService.create({
          role: role.id,
          model: workflowModel.id,
          action: Action.READ,
        });
      }
      const [existingUser] = await userService.find({ take: 1 });
      const user = existingUser
        ? await userService.updateOne(existingUser.id, {
            roles: [role.id],
            state: true,
          })
        : await userService.create({
            firstName: 'MCP',
            lastName: 'Agent',
            username: 'mcp-e2e-agent',
            email: 'mcp-e2e-agent@example.com',
            password: 'secret',
            roles: [role.id],
            avatar: null,
            state: true,
          });
      const { token: accessToken } = await mcpTokenService.createPersonalToken(
        user.id,
        {
          name: 'E2E Codex',
        },
      );
      const initialize = await request(app.getHttpServer())
        .post('/api/mcp')
        .set('Accept', 'application/json, text/event-stream')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2025-06-18',
            capabilities: {},
            clientInfo: { name: 'e2e', version: '1.0.0' },
          },
        })
        .expect(200);
      const sessionId = initialize.headers['mcp-session-id'];

      expect(sessionId).toBeTruthy();

      await request(app.getHttpServer())
        .post('/api/mcp')
        .set('Accept', 'application/json, text/event-stream')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('mcp-session-id', sessionId)
        .send({
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/call',
          params: {
            name: 'hexabot_workflow_search',
            arguments: { limit: 1 },
          },
        })
        .expect(200)
        .expect((response) => {
          const [, data] = response.text.match(/^data: (.+)$/m) ?? [];
          const payload = JSON.parse(data);

          expect(payload.result.content[0].text).toContain('items');
        });
    });
  });
});
