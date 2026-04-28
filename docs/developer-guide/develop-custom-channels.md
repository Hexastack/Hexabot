---
description: >-
  Build custom Hexabot channels that parse webhooks, map subscribers, and send
  platform-specific messages.
icon: webhook
---

# Develop Custom Channels

A Hexabot channel is the adapter between an external messaging platform and Hexabot workflows. It receives platform webhook events, converts them into Hexabot inbound events, and converts Hexabot outgoing envelopes back into the platform format.

Most custom channels should start as HTTP webhook channels. Use a WebSocket channel only when you are building an interactive client that keeps a live socket connected, like the built-in web widget.

### What A Channel Must Do

A working channel has four responsibilities:

1. Define source settings with zod. These are the per-source credentials and options shown in the admin UI.
2. Decode inbound payloads. Parse `req.body`, validate it, and return one or more `ChannelInboundEvent` instances.
3. Resolve subscriber data. Map the platform user to `SubscriberCreateDto`.
4. Send outbound messages. Convert `StdOutgoingMessageEnvelope` to the platform API payload and call the platform API.

The simplest route is:

* Extend `HttpChannelHandler`.
* Implement `decode()`, `doSendMessage()`, and `getSubscriberData()`.
* Override `verifyWebhook()` and `verifySignature()` only when the platform requires a handshake or signed webhooks.

### Discovery Rules

Hexabot discovers channel providers dynamically at startup. Your compiled output must contain at least one file that matches one of these patterns:

* Built-in API channels: `node_modules/@hexabot-ai/api/dist/extensions/channels/**/*.channel.js`
* Installed channel packages: `node_modules/hexabot-channel-*/**/*.channel.js`
* Local project channels: `dist/extensions/channels/**/*.channel.js`

For this starter project, put local channels under:

```
src/extensions/channels/<channel-name>/index.channel.ts
```

After build, that becomes:

```
dist/extensions/channels/<channel-name>/index.channel.js
```

If the channel is not returned by `GET /api/channel`, first check that the compiled `.channel.js` file exists and that the handler class is decorated with `@Injectable()`.

### Recommended File Layout

For a real channel, keep the transport class small and move parsing and message formatting into helpers:

```
src/extensions/channels/acme/
  index.channel.ts
  settings.schema.ts
  types.ts
  globals.d.ts
  inbound/
    acme-inbound-event-decoder.ts
  outbound/
    acme-outbound-message-encoder.ts
  services/
    acme-api.service.ts
  i18n/
    en.translations.json
```

For a first version, `index.channel.ts`, `settings.schema.ts`, `types.ts`, and `globals.d.ts` are enough. Add split decoders, encoders, and services when the handler starts growing.

### Source Settings

Source settings are per source. They belong to the channel handler constructor, not to `*.settings.ts` dynamic runtime settings files.

```ts
// src/extensions/channels/acme/settings.schema.ts
import z from "zod";

export const ACME_CHANNEL_NAME = "acme" as const;

export const ACME_CHANNEL_SOURCE_SETTINGS_SCHEMA = z
  .strictObject({
    api_url: z.url().default("https://api.acme.example").meta({
      title: "API URL",
      description: "Base URL for the Acme messaging API.",
    }),
    api_key: z.string().default("").meta({
      title: "API key",
      description: "Token used to call the Acme API.",
      "ui:widget": "password",
    }),
    verify_token: z.string().default("").meta({
      title: "Verify token",
      description: "Token used during webhook verification.",
      "ui:widget": "password",
    }),
    webhook_secret: z.string().default("").meta({
      title: "Webhook secret",
      description: "Secret used to verify signed webhook payloads.",
      "ui:widget": "password",
    }),
    tenant_id: z.string().default("").meta({
      title: "Tenant ID",
      description: "Optional tenant filter for incoming events.",
    }),
  })
  .meta({
    title: "Acme Channel",
  });

export type AcmeChannelSettings = z.infer<
  typeof ACME_CHANNEL_SOURCE_SETTINGS_SCHEMA
>;
```

Use `.meta()` because Hexabot converts this zod schema into the JSON schema returned by `GET /api/channel`.

Use `z.strictObject()` for payloads you control. For third-party webhooks that may add fields without notice, prefer `z.looseObject()` around the external payload and validate only the fields you actually use.

### Channel Attribute Typing

Channel attributes are the platform-specific data stored on the subscriber channel object. Type them once so event and subscriber code stays readable.

```ts
// src/extensions/channels/acme/globals.d.ts
import { ACME_CHANNEL_NAME } from "./settings.schema";

declare global {
  interface SubscriberChannelDict {
    [ACME_CHANNEL_NAME]: {
      tenantId: string;
      recipientId: string;
    };
  }
}

export {};
```

These attributes are not source settings. They describe the user/channel relationship, such as page id, account id, tenant id, or device id.

### Platform Payload Types

Define external contracts with zod first, then infer TypeScript types.

```ts
// src/extensions/channels/acme/types.ts
import z from "zod";

export namespace Acme {
  export const userRefSchema = z.strictObject({
    id: z.string(),
  });

  export const eventSchema = z.strictObject({
    id: z.string(),
    timestamp: z.number().optional(),
    tenant_id: z.string(),
    sender: userRefSchema,
    recipient: userRefSchema,
    message: z
      .strictObject({
        text: z.string().optional(),
        payload: z.string().optional(),
      })
      .optional(),
  });

  export const webhookSchema = z.strictObject({
    events: z.array(eventSchema),
  });

  export type Event = z.infer<typeof eventSchema>;
  export type Webhook = z.infer<typeof webhookSchema>;

  export type ChannelAttrs = {
    tenantId: string;
    recipientId: string;
  };

  export type SendResponse = {
    id?: string;
  };
}
```

The decoder should receive `unknown`, parse it immediately, and only work with the parsed type after that.

### Minimal HTTP Channel

This is a compact text-only channel. It supports inbound text and payload messages, sends outbound text, and leaves rich messages for later.

```ts
// src/extensions/channels/acme/index.channel.ts
import {
  ActionOptions,
  IncomingMessageType,
  OutgoingMessageType,
  Source,
  StdOutgoingMessageEnvelope,
} from "@hexabot-ai/types";
import {
  ChannelCapabilities,
  ChannelInboundEvent,
  ChannelInboundEventContext,
  DEFAULT_CHANNEL_CAPABILITIES,
  HttpChannelHandler,
  MessageInboundEvent,
  SubscriberCreateDto,
  SyntheticMessageInboundEvent,
} from "@hexabot-ai/api";
import { Injectable } from "@nestjs/common";
import { Request, Response } from "express";

import {
  ACME_CHANNEL_NAME,
  ACME_CHANNEL_SOURCE_SETTINGS_SCHEMA,
  AcmeChannelSettings,
} from "./settings.schema";
import { Acme } from "./types";

@Injectable()
export default class AcmeChannelHandler extends HttpChannelHandler<
  typeof ACME_CHANNEL_NAME
> {
  constructor() {
    super(ACME_CHANNEL_NAME, ACME_CHANNEL_SOURCE_SETTINGS_SCHEMA);
  }

  getCapabilities(): ChannelCapabilities {
    return {
      ...DEFAULT_CHANNEL_CAPABILITIES,
      [OutgoingMessageType.quickReply]: false,
      [OutgoingMessageType.buttons]: false,
      [OutgoingMessageType.attachment]: false,
      [OutgoingMessageType.list]: false,
      [OutgoingMessageType.carousel]: false,
      typingIndicator: false,
      maxTextLength: 2000,
    };
  }

  protected async verifyWebhook(
    req: Request,
    res: Response,
    source: Source,
  ): Promise<void> {
    const settings = this.parseSettings(source.settings);
    const token = this.getQueryParam(req, "verify_token");
    const challenge = this.getQueryParam(req, "challenge");

    if (token && token === settings.verify_token) {
      res.status(200).send(challenge ?? "OK");
      return;
    }

    res.sendStatus(403);
  }

  protected async decode(
    req: Request,
    source: Source,
  ): Promise<ChannelInboundEvent<typeof ACME_CHANNEL_NAME>[]> {
    const settings = this.parseSettings(source.settings);
    const payload = Acme.webhookSchema.parse(req.body);

    return payload.events.flatMap((event) => {
      if (settings.tenant_id && event.tenant_id !== settings.tenant_id) {
        return [];
      }

      return this.toInboundEvent(event);
    });
  }

  protected async doSendMessage(
    event: MessageInboundEvent<typeof ACME_CHANNEL_NAME>,
    envelope: StdOutgoingMessageEnvelope,
    _options: ActionOptions,
  ): Promise<{ mid: string }> {
    if (envelope.type !== OutgoingMessageType.text) {
      throw new Error(`Unsupported Acme message type: ${envelope.type}`);
    }

    const settings = this.parseSettings(event.getSourceSettings());
    const response = await fetch(`${settings.api_url}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${settings.api_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: event.getSenderForeignId(),
        text: envelope.data.text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Acme send failed with HTTP ${response.status}`);
    }

    const body = (await response.json()) as Acme.SendResponse;

    return { mid: body.id ?? `${Date.now()}` };
  }

  async getSubscriberData(
    event: MessageInboundEvent<typeof ACME_CHANNEL_NAME>,
  ): Promise<SubscriberCreateDto> {
    return {
      foreignId: event.getSenderForeignId(),
      firstName: "Acme",
      lastName: "User",
      assignedTo: null,
      assignedAt: null,
      lastvisit: new Date(),
      retainedFrom: new Date(),
      avatar: null,
      channel: event.getChannelData(),
      language: "",
      locale: "",
      timezone: 0,
      gender: null,
      country: null,
      labels: [],
      source: event.getSourceId() ?? "",
    };
  }

  private toInboundEvent(
    event: Acme.Event,
  ): ChannelInboundEvent<typeof ACME_CHANNEL_NAME>[] {
    if (!event.message) {
      return [];
    }

    const context = new ChannelInboundEventContext(
      ACME_CHANNEL_NAME,
      event,
      {
        tenantId: event.tenant_id,
        recipientId: event.recipient.id,
      },
      this.getOccurredAt(event),
      event.id,
      event.sender.id,
      event.recipient.id,
    );

    if (event.message.payload) {
      return [
        new SyntheticMessageInboundEvent(
          context,
          {
            type: IncomingMessageType.quickReply,
            data: {
              text: event.message.text ?? event.message.payload,
              payload: event.message.payload,
            },
          },
          IncomingMessageType.quickReply,
        ),
      ];
    }

    if (event.message.text) {
      return [
        new SyntheticMessageInboundEvent(
          context,
          {
            type: IncomingMessageType.text,
            data: { text: event.message.text },
          },
          IncomingMessageType.text,
        ),
      ];
    }

    return [];
  }

  private parseSettings(settings: unknown): AcmeChannelSettings {
    return ACME_CHANNEL_SOURCE_SETTINGS_SCHEMA.parse(settings ?? {});
  }

  private getOccurredAt(event: Acme.Event): Date {
    if (typeof event.timestamp === "number") {
      const date = new Date(event.timestamp);

      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }

    return new Date();
  }

  private getQueryParam(req: Request, key: string): string | null {
    const value = req.query[key];

    if (Array.isArray(value)) {
      return typeof value[0] === "string" ? value[0] : null;
    }

    return typeof value === "string" ? value : null;
  }
}
```

Important behavior to understand:

* `HttpChannelHandler` routes `GET` requests to `verifyWebhook()`.
* For `POST`, it runs `verifySignature()`, then `decode()`.
* After successful decode it sends HTTP 200, then dispatches events to the workflow pipeline.
* Keep `decode()` cheap. Do not fetch profiles, download files, or call the platform API from `decode()`.

### When To Split Decoder And Encoder

The minimal handler is fine while the platform supports only text. Split the codec when you add several event types or rich outgoing formats.

The built-in web channel uses this pattern:

* `WebInboundEventDecoder` parses the raw event and returns concrete inbound event classes.
* `WebOutboundMessageEncoder` maps Hexabot envelopes to web channel payloads.
* The handler composes both with `@ExtensionInject()`.

A custom channel can use the same pattern:

```ts
@ExtensionInject((name) => createAcmeInboundEventDecoder(name))
private inboundEventDecoder!: AcmeInboundEventDecoder<
  typeof ACME_CHANNEL_NAME
>;

@ExtensionInject((name) => createAcmeOutboundMessageEncoder(name))
private outboundMessageEncoder!: AcmeOutboundMessageEncoder;
```

`@ExtensionInject()` is useful for helper classes that should be created for the current channel handler at module initialization. Use normal Nest `@Inject()` for ordinary singleton services.

### Webhook Verification And Signatures

Many platforms do two separate checks:

* `GET /api/webhook/:sourceRef` verifies the webhook subscription.
* `POST /api/webhook/:sourceRef` verifies every incoming payload.

Override `verifyWebhook()` for challenge-response handshakes. Override `verifySignature()` for HMAC or token verification.

```ts
import { createHmac, timingSafeEqual } from 'crypto';

type RawBodyRequest = Request & {
  rawBody?: string | Buffer;
};

protected async verifySignature(
  req: Request,
  _res: Response,
  source: Source,
): Promise<void> {
  const settings = this.parseSettings(source.settings);
  const signature = req.header('x-acme-signature');
  const rawBody = (req as RawBodyRequest).rawBody;

  if (!signature || !rawBody || !settings.webhook_secret) {
    throw new Error('Missing webhook signature data');
  }

  const expected = createHmac('sha256', settings.webhook_secret)
    .update(typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8'))
    .digest('hex');

  const actualBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');

  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    throw new Error('Invalid webhook signature');
  }
}
```

Throw from `verifySignature()` to reject the request with HTTP 401.

### Outgoing Message Support

Declare the platform limits in `getCapabilities()`. This prevents Hexabot from trying to send message types that the channel cannot handle.

Typical capability choices:

* Start with text only.
* Enable quick replies when the platform has a native equivalent.
* Enable buttons only if you can preserve title, payload, and URL semantics.
* Enable list/carousel only when you can map content fields reliably.
* Set `maxTextLength` to the platform limit, or `0` if there is no known limit.

When you add rich messages, put the formatting logic in an outbound encoder that extends `ChannelOutboundMessageEncoder`. The encoder should use `dispatchEnvelope()` and handle every `OutgoingMessageType`, even if some handlers just throw because the platform does not support them.

### Attachments

Inbound attachments usually need two steps:

1. Decode the platform payload into an attachment inbound event.
2. Implement `getMessageAttachments(event)` on the handler so Hexabot can download and persist the files.

Outbound attachments usually use:

```ts
await this.channelAttachmentService.getPublicUrl(sourceId, attachmentRef);
```

The default URL is a signed Hexabot download URL under:

```
/api/webhook/:sourceRef/download/:name?t=<jwt>
```

Override `getAttachmentPublicUrl()` if the platform requires files to be uploaded to its own media API first, or if the platform cannot access signed download URLs.

### Building As An NPM Package

Use the `hexabot-channel-` package prefix so dynamic discovery can find it:

```json
{
  "name": "hexabot-channel-acme",
  "version": "1.0.0",
  "description": "Acme channel extension for Hexabot.",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "require": "./dist/index.js",
      "import": "./dist/index.js"
    },
    "./index.channel": {
      "types": "./dist/index.channel.d.ts",
      "require": "./dist/index.channel.js",
      "import": "./dist/index.channel.js"
    }
  },
  "files": ["dist", "src", "README.md", "LICENSE.md"],
  "peerDependencies": {
    "@hexabot-ai/api": ">=3 <4",
    "@hexabot-ai/types": ">=3 <4",
    "@nestjs/common": "^11.1.6",
    "zod": "^4.3.6"
  }
}
```

The compiled package must include a `dist/**/*.channel.js` file. The source settings schema should still be passed to the handler constructor with:

```ts
super(ACME_CHANNEL_NAME, ACME_CHANNEL_SOURCE_SETTINGS_SCHEMA);
```

Do not put per-source channel settings in `*.settings.ts` files. That pattern is reserved for global runtime setting groups discovered by the settings module.

### Registering And Testing

1.  Build the project:

    ```sh
    npm run build
    ```
2.  Start Hexabot:

    ```sh
    npm run dev
    ```
3.  Confirm the channel is registered:

    ```sh
    curl http://localhost:4000/api/channel
    ```
4.  Create or enable a source for the channel from the admin UI or source API. The platform webhook URL should use the source reference:

    ```
    https://your-domain.example/api/webhook/<sourceRef>
    ```
5.  Send a test payload:

    ```sh
    curl -X POST "http://localhost:4000/api/webhook/<sourceRef>" \
      -H "Content-Type: application/json" \
      -d '{
        "events": [
          {
            "id": "evt_1",
            "timestamp": 1760000000000,
            "tenant_id": "tenant_1",
            "sender": { "id": "user_1" },
            "recipient": { "id": "bot_1" },
            "message": { "text": "hello" }
          }
        ]
      }'
    ```

If the request returns 400, the zod payload schema rejected the body. If it returns 401, `verifySignature()` rejected the request. If it returns 200 but no workflow runs, check that the source is active, has a default workflow or the URL contains a workflow id, and that the event has a sender foreign id.

### Reference Implementations

Use these v3 implementations as references:

* Built-in web channel in this project dependency: `node_modules/@hexabot-ai/api/src/extensions/channels/web`
* Facebook channel package: `https://github.com/Hexastack/hexabot-channel-facebook`

The web channel is useful for WebSocket and history/session patterns. The Facebook channel is useful for HTTP webhook patterns: source settings, zod schemas, signature verification, batched inbound decoding, outbound rich message encoding, profile lookup, attachment download, and channel health checks.

### Troubleshooting Checklist

* Channel missing from `GET /api/channel`: build output does not contain `dist/extensions/channels/**/*.channel.js`, the class is not `@Injectable()`, or the file does not export the handler as the default export.
* Settings missing in the admin UI: the handler did not pass the zod schema to `super(name, schema)`.
* Payload always rejected: parse only the fields you need, and use `z.looseObject()` for third-party payloads that may contain extra fields.
* Platform retries webhooks: make sure signature verification and decoding pass quickly enough to return HTTP 200.
* Messages are created but no replies are sent: verify `getCapabilities()` and `doSendMessage()`, then check the platform API response and credentials.
* Subscriber data fails validation: return a valid `source`, `channel`, `foreignId`, `labels`, assignment fields, and profile fields from `getSubscriberData()`.
