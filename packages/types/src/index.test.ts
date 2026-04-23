/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  AttachmentAccess,
  AttachmentCreatedByRef,
  AttachmentResourceRef,
  FieldType,
  MemoryScope,
  McpServerTransport,
  MenuType,
  StatsType,
  WorkflowType,
  WorkflowVersionAction,
  attachmentFullSchema,
  attachmentSchema,
  contentFullSchema,
  contentSchema,
  createWorkflowFullSchema,
  credentialFullSchema,
  credentialSchema,
  dummySchema,
  labelFullSchema,
  labelSchema,
  mcpServerFullSchema,
  mcpServerSchema,
  memoryRecordFullSchema,
  memoryRecordSchema,
  menuFullSchema,
  menuSchema,
  messageFullSchema,
  permissionFullSchema,
  permissionSchema,
  resolveRunDurationMs,
  settingSchema,
  subscriberFullSchema,
  subscriberSchema,
  threadFullSchema,
  userFullSchema,
  userSchema,
  workflowFullSchema,
  workflowRunFullSchema,
  workflowRunSchema,
  workflowVersionFullSchema,
} from "./index";

describe("@hexabot-ai/types schemas", () => {
  const now = "2026-01-01T00:00:00.000Z";

  it("maps user aliases and strips unknown keys", () => {
    const parsed = userSchema.parse({
      id: "u_1",
      createdAt: now,
      updatedAt: now,
      firstName: "Ada",
      lastName: "Lovelace",
      language: "en",
      timezone: 1,
      locale: null,
      gender: null,
      country: null,
      foreignId: "foreign-u-1",
      assignedAt: null,
      lastvisit: null,
      retainedFrom: null,
      channel: { name: "web", data: { id: "sub_1" } },
      username: "ada",
      email: "ada@example.com",
      sendEmail: false,
      state: true,
      resetCount: 0,
      resetToken: null,
      provider: { strategy: "local" },
      roleIds: ["r_1", "r_2"],
      avatarId: "a_1",
      shouldDrop: true,
    });

    expect(parsed.roles).toEqual(["r_1", "r_2"]);
    expect(parsed.avatar).toBe("a_1");
    expect("roleIds" in parsed).toBe(false);
    expect("avatarId" in parsed).toBe(false);
    expect("shouldDrop" in parsed).toBe(false);
  });

  it("parses strict nested user full payloads", () => {
    const parsed = userFullSchema.parse({
      id: "u_1",
      createdAt: now,
      updatedAt: now,
      firstName: "Ada",
      lastName: "Lovelace",
      language: "en",
      timezone: 1,
      locale: null,
      gender: null,
      country: null,
      foreignId: "foreign-u-1",
      assignedAt: null,
      lastvisit: null,
      retainedFrom: null,
      channel: { name: "web", data: { id: "sub_1" } },
      username: "ada",
      email: "ada@example.com",
      sendEmail: false,
      state: true,
      resetCount: 0,
      resetToken: null,
      provider: { strategy: "local" },
      roles: [
        {
          id: "r_1",
          createdAt: now,
          updatedAt: now,
          name: "admin",
          active: true,
          shouldDrop: true,
        },
      ],
      avatar: {
        id: "a_1",
        createdAt: now,
        updatedAt: now,
        name: "avatar.png",
        type: "image/png",
        size: 100,
        location: "/tmp/avatar.png",
        resourceRef: AttachmentResourceRef.UserAvatar,
        access: AttachmentAccess.Private,
        createdByRef: AttachmentCreatedByRef.User,
        createdById: "u_1",
        url: "/attachment/download/a_1/avatar.png",
      },
    });

    expect(parsed.roles[0].id).toBe("r_1");
    expect("shouldDrop" in parsed.roles[0]).toBe(false);
    expect(parsed.avatar?.createdBy).toBe("u_1");
  });

  it("does not alias relation id fields into user full relation objects", () => {
    const parsed = userFullSchema.parse({
      id: "u_1",
      createdAt: now,
      updatedAt: now,
      firstName: "Ada",
      lastName: "Lovelace",
      language: "en",
      timezone: 1,
      locale: null,
      gender: null,
      country: null,
      foreignId: "foreign-u-1",
      assignedAt: null,
      lastvisit: null,
      retainedFrom: null,
      channel: { name: "web", data: { id: "sub_1" } },
      username: "ada",
      email: "ada@example.com",
      sendEmail: false,
      state: true,
      resetCount: 0,
      resetToken: null,
      provider: { strategy: "local" },
      roleIds: ["r_1"],
      avatarId: "a_1",
      labelIds: ["l_1"],
      assignedToId: "u_2",
    });

    expect(parsed.roles).toEqual([]);
    expect(parsed.avatar).toBeNull();
    expect(parsed.labels).toEqual([]);
    expect(parsed.assignedTo).toBeNull();
  });

  it("does not alias relation id fields into subscriber full relation objects", () => {
    const parsed = subscriberFullSchema.parse({
      id: "s_1",
      createdAt: now,
      updatedAt: now,
      firstName: "Ada",
      lastName: "Lovelace",
      language: "en",
      timezone: 0,
      locale: null,
      gender: null,
      country: null,
      foreignId: "foreign-s-1",
      assignedAt: null,
      lastvisit: null,
      retainedFrom: null,
      channel: { name: "web", data: null },
      labelIds: ["l_1"],
      assignedToId: "u_1",
      avatarId: "a_1",
    });

    expect(parsed.labels).toEqual([]);
    expect(parsed.assignedTo).toBeNull();
    expect(parsed.avatar).toBeNull();
  });

  it("does not alias relation id fields into other strict full relation objects", () => {
    const assertInvalidRelationField = (
      result:
        | ReturnType<typeof permissionFullSchema.safeParse>
        | ReturnType<typeof contentFullSchema.safeParse>
        | ReturnType<typeof threadFullSchema.safeParse>
        | ReturnType<typeof messageFullSchema.safeParse>
        | ReturnType<typeof workflowVersionFullSchema.safeParse>
        | ReturnType<typeof workflowRunFullSchema.safeParse>,
      relationField: string,
    ) => {
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((issue) => issue.path[0] === relationField),
        ).toBe(true);
      }
    };

    assertInvalidRelationField(
      permissionFullSchema.safeParse({
        id: "p_1",
        createdAt: now,
        updatedAt: now,
        action: "read",
        relation: "role",
        modelId: "m_1",
        roleId: "r_1",
      }),
      "model",
    );

    assertInvalidRelationField(
      contentFullSchema.safeParse({
        id: "c_1",
        createdAt: now,
        updatedAt: now,
        title: "Welcome",
        status: true,
        properties: {},
        searchText: "welcome",
        contentTypeId: "ct_1",
      }),
      "contentType",
    );

    assertInvalidRelationField(
      threadFullSchema.safeParse({
        id: "th_1",
        createdAt: now,
        updatedAt: now,
        status: "open",
        subscriberId: "s_1",
      }),
      "subscriber",
    );

    assertInvalidRelationField(
      messageFullSchema.safeParse({
        id: "msg_1",
        createdAt: now,
        updatedAt: now,
        message: "hello",
        read: false,
        delivery: false,
        handover: false,
        threadId: "th_1",
      }),
      "thread",
    );

    assertInvalidRelationField(
      workflowVersionFullSchema.safeParse({
        id: "wfv_1",
        createdAt: now,
        updatedAt: now,
        version: 1,
        definitionYml: "defs: {}\nflow: []\noutputs: {}",
        checksum: "sha",
        workflowId: "wf_1",
        parentVersionId: null,
        createdById: "u_1",
      }),
      "workflow",
    );

    assertInvalidRelationField(
      workflowRunFullSchema.safeParse({
        id: "run_1",
        createdAt: now,
        updatedAt: now,
        status: "running",
        context: {},
        workflowId: "wf_1",
        workflowVersionId: null,
        triggeredById: "s_1",
        threadId: "th_1",
      }),
      "workflow",
    );

    expect(() =>
      memoryRecordFullSchema.parse({
        id: "mem_1",
        createdAt: now,
        updatedAt: now,
        value: { counter: 1 },
        definitionId: "def_1",
        ownerId: "u_1",
        workflowId: "wf_1",
        runId: "run_1",
        threadId: "th_1",
      }),
    ).toThrow();
  });

  it("keeps nullable or optional full relation fields when only alias ids are provided", () => {
    const credential = credentialFullSchema.parse({
      id: "cred_1",
      createdAt: now,
      updatedAt: now,
      name: "OPENAI_API_KEY",
      ownerId: "u_1",
    });
    const label = labelFullSchema.parse({
      id: "l_1",
      createdAt: now,
      updatedAt: now,
      title: "VIP",
      name: "vip",
      builtin: false,
      groupId: "g_1",
    });
    const menu = menuFullSchema.parse({
      id: "mn_1",
      createdAt: now,
      updatedAt: now,
      title: "Home",
      type: MenuType.nested,
      parentId: "mn_root",
    });
    const mcp = mcpServerFullSchema.parse({
      id: "mcp_1",
      createdAt: now,
      updatedAt: now,
      name: "Filesystem",
      enabled: true,
      transport: McpServerTransport.stdio,
      credentialId: "cred_1",
    });
    const workflow = workflowFullSchema.parse({
      id: "wf_1",
      createdAt: now,
      updatedAt: now,
      name: "Main",
      description: null,
      type: WorkflowType.conversational,
      schedule: null,
      inputSchema: {},
      builtin: false,
      x: 0,
      y: 0,
      zoom: 1,
      direction: "horizontal",
      currentVersionId: "wfv_1",
      publishedVersionId: "wfv_1",
      createdById: "u_1",
    });

    expect(credential.owner).toBeNull();
    expect(label.group).toBeUndefined();
    expect(menu.parent).toBeUndefined();
    expect(mcp.credential).toBeUndefined();
    expect(workflow.currentVersion).toBeNull();
    expect(workflow.publishedVersion).toBeNull();
    expect(workflow.createdBy).toBeNull();
  });

  it("maps attachment aliases and strips unknown keys", () => {
    const parsed = attachmentSchema.parse({
      id: "a_1",
      createdAt: now,
      updatedAt: now,
      name: "file.png",
      type: "image/png",
      size: 100,
      location: "/tmp/file.png",
      resourceRef: AttachmentResourceRef.MessageAttachment,
      access: AttachmentAccess.Public,
      createdByRef: AttachmentCreatedByRef.Subscriber,
      createdById: "s_1",
      url: "/attachment/download/a_1/file.png",
      shouldDrop: true,
    });

    expect(parsed.createdBy).toBe("s_1");
    expect("createdById" in parsed).toBe(false);
    expect("shouldDrop" in parsed).toBe(false);
  });

  it("supports nullable nested attachment owner in full payloads", () => {
    const parsed = attachmentFullSchema.parse({
      id: "a_1",
      createdAt: now,
      updatedAt: now,
      name: "file.png",
      type: "image/png",
      size: 100,
      location: "/tmp/file.png",
      resourceRef: AttachmentResourceRef.MessageAttachment,
      access: AttachmentAccess.Public,
      createdByRef: AttachmentCreatedByRef.Subscriber,
      createdBy: null,
      url: "/attachment/download/a_1/file.png",
    });

    expect(parsed.createdBy).toBeNull();
  });

  it("preserves alias mapping for chat/cms/user-access plain contracts", () => {
    const label = labelSchema.parse({
      id: "l_1",
      createdAt: now,
      updatedAt: now,
      title: "VIP",
      name: "VIP",
      builtin: false,
      groupId: "g_1",
      users: [{ id: "s_1" }],
    });
    const subscriber = subscriberSchema.parse({
      id: "s_1",
      createdAt: now,
      updatedAt: now,
      firstName: "Ada",
      lastName: "Lovelace",
      language: "en",
      timezone: 0,
      locale: null,
      gender: null,
      country: null,
      foreignId: "foreign-s-1",
      assignedAt: null,
      lastvisit: null,
      retainedFrom: null,
      channel: { name: "web", data: null },
      labelIds: ["l_1"],
      assignedToId: "u_1",
      avatarId: "a_1",
    });
    const content = contentSchema.parse({
      id: "c_1",
      createdAt: now,
      updatedAt: now,
      title: "Welcome",
      status: true,
      properties: { body: "hello" },
      searchText: "Welcome hello",
      contentTypeId: "ct_1",
    });
    const permission = permissionSchema.parse({
      id: "p_1",
      createdAt: now,
      updatedAt: now,
      action: "read",
      relation: "role",
      modelId: "m_1",
      roleId: "r_1",
    });

    expect(label.group).toBe("g_1");
    expect("users" in label).toBe(true);
    expect(subscriber.labels).toEqual(["l_1"]);
    expect(subscriber.assignedTo).toBe("u_1");
    expect(subscriber.avatar).toBe("a_1");
    expect(content.contentType).toBe("ct_1");
    expect(permission.model).toBe("m_1");
    expect(permission.role).toBe("r_1");
  });

  it("normalizes nullable and optional values for setting/menu/mcp", () => {
    const setting = settingSchema.parse({
      id: "st_1",
      createdAt: now,
      updatedAt: now,
      group: "chatbot_settings",
      subgroup: null,
      label: "title",
      value: "Hexabot",
    });
    const menu = menuSchema.parse({
      id: "mn_1",
      createdAt: now,
      updatedAt: now,
      title: "Home",
      type: MenuType.nested,
      parentId: null,
      payload: null,
      url: null,
    });
    const mcp = mcpServerSchema.parse({
      id: "mcp_1",
      createdAt: now,
      updatedAt: now,
      name: "Filesystem",
      enabled: true,
      transport: McpServerTransport.stdio,
      command: "npx",
      args: ["-y", "@mcp/server-filesystem"],
      url: null,
      cwd: "/tmp",
      credentialId: null,
      shouldDrop: true,
    });

    expect(setting.subgroup).toBeNull();
    expect(menu.parent).toBeNull();
    expect(mcp.credential).toBeNull();
    expect("shouldDrop" in mcp).toBe(false);
  });

  it("keeps credential outputs free of secret value fields", () => {
    const credential = credentialSchema.parse({
      id: "cred_1",
      createdAt: now,
      updatedAt: now,
      name: "OPENAI_API_KEY",
      ownerId: "u_1",
      value: "secret",
    });

    expect(credential.name).toBe("OPENAI_API_KEY");
    expect(credential.owner).toBe("u_1");
    expect("value" in credential).toBe(false);
  });

  it("computes workflow derived fields via parser bridge", () => {
    const parser = jest.fn((yml: string) => ({
      defs: {},
      flow: [],
      outputs: {},
      yml,
    }));
    const parsed = createWorkflowFullSchema({ parseDefinition: parser }).parse({
      id: "wf_1",
      createdAt: now,
      updatedAt: now,
      name: "Main",
      description: null,
      type: WorkflowType.conversational,
      schedule: null,
      inputSchema: {},
      builtin: false,
      x: 0,
      y: 0,
      zoom: 1,
      direction: "horizontal",
      runAfterMs: 0,
      createdBy: {
        id: "u_1",
        createdAt: now,
        updatedAt: now,
        firstName: "Ada",
        lastName: "Lovelace",
        language: "en",
        timezone: 1,
        locale: null,
        gender: null,
        country: null,
        foreignId: "foreign-u-1",
        assignedAt: null,
        lastvisit: null,
        retainedFrom: null,
        channel: { name: "web" },
        username: "ada",
        email: "ada@example.com",
        sendEmail: false,
        state: true,
        resetCount: 0,
        resetToken: null,
        roles: [],
        labels: [],
        assignedTo: null,
        avatar: null,
      },
      currentVersion: {
        id: "wfv_1",
        createdAt: now,
        updatedAt: now,
        version: 1,
        definitionYml: "defs: {}\nflow: []\noutputs: {}",
        checksum: "sha",
        message: null,
        action: WorkflowVersionAction.create,
        workflowId: "wf_1",
        createdById: "u_1",
        parentVersionId: null,
      },
      publishedVersion: null,
    });

    expect(parsed.definitionYml).toContain("defs");
    expect(parsed.definition).toEqual({
      defs: {},
      flow: [],
      outputs: {},
      yml: "defs: {}\nflow: []\noutputs: {}",
    });
    expect(parser).toHaveBeenCalledTimes(1);
  });

  it("computes workflow run duration and mixed triggeredBy coercion", () => {
    const run = workflowRunSchema.parse({
      id: "run_1",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:01:00.000Z",
      status: "finished",
      context: {},
      workflowId: "wf_1",
      workflowVersionId: "wfv_1",
      triggeredById: "s_1",
      threadId: "t_1",
      finishedAt: "2026-01-01T00:02:00.000Z",
    });
    const full = workflowRunFullSchema.parse({
      id: "run_1",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:01:00.000Z",
      status: "running",
      context: {},
      workflow: {
        id: "wf_1",
        createdAt: now,
        updatedAt: now,
        name: "Main",
        description: null,
        type: WorkflowType.conversational,
        schedule: null,
        inputSchema: {},
        builtin: false,
        x: 0,
        y: 0,
        zoom: 1,
        direction: "horizontal",
        currentVersion: null,
        publishedVersion: null,
        createdBy: "u_1",
        runAfterMs: 0,
      },
      workflowVersion: null,
      triggeredBy: {
        id: "s_1",
        createdAt: now,
        updatedAt: now,
        firstName: "Sub",
        lastName: "User",
        language: "en",
        timezone: 0,
        locale: null,
        gender: null,
        country: null,
        foreignId: "foreign-s-1",
        assignedAt: null,
        lastvisit: null,
        retainedFrom: null,
        channel: { name: "web", data: {} },
        labels: [],
        assignedTo: null,
        avatar: null,
      },
      thread: null,
    });

    expect(run.duration).toBe(120000);
    expect(full.triggeredBy?.id).toBe("s_1");
    expect(typeof resolveRunDurationMs(run)).toBe("number");
  });

  it("coerces workflow memory aliases and test dummy fixtures", () => {
    const record = memoryRecordSchema.parse({
      id: "mem_1",
      createdAt: now,
      updatedAt: now,
      value: { counter: 1 },
      ttlSeconds: 60,
      expiresAt: null,
      definitionId: "def_1",
      ownerId: "u_1",
      workflowId: "wf_1",
      runId: "run_1",
      threadId: "th_1",
    });
    const dummy = dummySchema.parse({
      id: "d_1",
      createdAt: now,
      updatedAt: now,
      dummy: "ok",
      dynamicField: { field: FieldType.text },
      shouldDrop: true,
    });

    expect(record.definition).toBe("def_1");
    expect(record.owner).toBe("u_1");
    expect(record.workflow).toBe("wf_1");
    expect(record.run).toBe("run_1");
    expect(record.thread).toBe("th_1");
    expect(dummy.dynamicField).toEqual({ field: FieldType.text });
    expect("shouldDrop" in dummy).toBe(false);
  });

  it("supports analytics enums in stats payloads", () => {
    const stats = {
      id: "st_1",
      createdAt: now,
      updatedAt: now,
      type: StatsType.incoming,
      day: now,
      value: 15,
      name: "incoming",
    };

    expect(stats.type).toBe(StatsType.incoming);
  });

  it("supports memory scope enum values", () => {
    expect(MemoryScope.workflow).toBe("workflow");
  });
});
