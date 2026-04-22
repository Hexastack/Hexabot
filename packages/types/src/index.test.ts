/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  AttachmentAccess,
  AttachmentCreatedByRef,
  AttachmentResourceRef,
  coerceAttachment,
  coerceAttachmentFull,
  coerceUser,
  coerceUserFull,
} from "./index";

describe("@hexabot-ai/types schemas", () => {
  const now = "2026-01-01T00:00:00.000Z";

  it("maps user aliases and strips unknown keys", () => {
    const parsed = coerceUser({
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
      foreignId: null,
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
    const parsed = coerceUserFull({
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
      foreignId: null,
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
          code: "ADMIN",
          label: "Admin",
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

  it("maps attachment aliases and strips unknown keys", () => {
    const parsed = coerceAttachment({
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
    const parsed = coerceAttachmentFull({
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
});
