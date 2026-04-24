# Channel Module

The channel module is the transport boundary between external messaging platforms and Hexabot workflows.

It is responsible for:

- Discovering and registering channel handlers dynamically.
- Exposing webhook entrypoints.
- Decoding inbound platform payloads into typed channel events.
- Encoding outbound standard envelopes into platform wire formats.
- Resolving subscribers and dispatching workflow hook events.

## Runtime Architecture

At startup:

1. `createHexabotApplication()` calls `resolveDynamicProviders()` before Nest bootstraps.
2. `ChannelModule` loads providers matching:
   - `node_modules/@hexabot-ai/api/dist/extensions/channels/**/*.channel.js`
   - `node_modules/hexabot-channel-*/**/*.channel.js`
   - `dist/extensions/channels/**/*.channel.js`
3. Each channel handler extends `ChannelHandler` and self-registers in `ChannelService` during `onModuleInit()`.

At request time:

1. `WebhookController` receives `/webhook` requests.
2. `ChannelService` resolves the handler by channel name.
3. The handler transport (`HttpChannelHandler` or `WebSocketChannelHandler`) processes the request.
4. Inbound payloads are decoded into `ChannelInboundEvent` instances.
5. Events are emitted through `ChannelEventBus` to the chatbot/workflow pipeline.

## HTTP Surface

`WebhookController` is mounted at `/webhook` (effective path is `/api/webhook/*` because of the global `/api` prefix):

- `GET /api/webhook/:channel`
- `POST /api/webhook/:channel`
- `GET /api/webhook/:channel/:workflowId`
- `POST /api/webhook/:channel/:workflowId`
- `GET /api/webhook/:channel/download/:name?t=<jwt>`
- `GET /api/webhook/:channel/not-found`

Also available:

- `GET /api/channel` returns registered channel names.

## Core Contracts

### `ChannelHandler`

Base abstraction for all channels:

- `handle(req, res, workflowId?)`: transport entrypoint.
- `doSendMessage(event, envelope, options)`: channel-specific outbound send.
- `getSubscriberData(event)`: map platform user data to `SubscriberCreateDto`.
- `getSettings()`: runtime settings lookup from zod-backed registry.
- `getCapabilities()`: declares supported outgoing formats and features.

Optional extension points:

- `getMessageAttachments(event)`
- `getSubscriberAvatar(event)`
- `hasDownloadAccess(attachment, req)`
- `getAttachmentPublicUrl(attachment)`

### Transport Base Classes

- `HttpChannelHandler`: for classic webhook channels. It handles:
  - GET handshake (`verifyWebhook`)
  - POST signature verification (`verifySignature`)
  - decode + async event dispatch
- `WebSocketChannelHandler`: for Socket.IO channels. It handles:
  - socket request validation
  - GET/POST routing to `processSocketGet` and `processSocketPost`
  - broadcast helpers (`broadcast`, `sendTypingIndicator`)

### Inbound Event Contracts

- `ChannelInboundEventContext`: immutable context holder for raw payload + metadata.
- `ChannelInboundEvent`: base typed event.
- `MessageInboundEvent`: message-specialized event (`toStdIncomingMessage`, `buildInput`, `preprocess`).
- `ChannelInboundEventDecoder`: contract for inbound decoders:

```ts
interface ChannelInboundEventDecoder<N extends ChannelName> {
  readonly channel: N;
  createEvents(raw: unknown, channelAttrs: SubscriberChannelDict[N]): ChannelInboundEvent<N>[];
}
```

## Schemas and Typing (Zod First)

Channels should define contracts as zod schemas, then infer TS types from those schemas.

The web channel is the reference pattern:

- `WEB_CHANNEL_SETTINGS_SCHEMA` is a strict zod object for runtime settings.
- `Web.eventSchema` is a discriminated zod union for inbound events.
- Decoder parses first (`Web.eventSchema.parse(raw)`), then maps payloads to event classes.

This gives:

- Runtime validation for external payloads.
- Strong type inference in handlers/encoders.
- Automatic settings introspection via JSON schema generation.

## Codec Design

Hexabot supports both styles:

- Split classes:
  - inbound decoder (`ChannelInboundEventDecoder`)
  - outbound encoder (`ChannelOutboundMessageEncoder`)
- Unified codec (`ChannelCodec`) that exposes both `decode` and `encode`.

The web channel uses split codecs and composes them in the handler:

- `WebInboundEventDecoder` for inbound webhook/socket events.
- `WebOutboundMessageEncoder` for outbound platform messages.
- `WebInboundMessageEncoder` for history sync formatting.

## Extra Per-Channel Services With `@ExtensionInject()`

Use `@ExtensionInject()` for lazily created, per-extension service instances.

Example from web channel:

```ts
@ExtensionInject((name) => createWebOutboundMessageEncoder(name))
private outboundMessageEncoder!: WebOutboundMessageEncoder;

@ExtensionInject((name) => createWebInboundEventDecoder(name))
private inboundEventDecoder!: WebInboundEventDecoder<N>;

@ExtensionInject(WebSessionService)
private sessionService!: WebSessionService;
```

These properties are instantiated in `ChannelHandler.onModuleInit()` through `ModuleRef.create()`.

## Building a New Channel as an npm Package

### 1) Package naming and build output

Use package name prefix `hexabot-channel-` so it matches dynamic discovery patterns.

Your compiled output must contain:

- at least one `*.channel.js` file
- if using runtime settings, one or more `*.settings.js` files

Example `package.json`:

```json
{
  "name": "hexabot-channel-acme",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist", "src"],
  "peerDependencies": {
    "@hexabot-ai/api": "^3.0.0",
    "@hexabot-ai/types": "^3.0.0"
  }
}
```

### 2) Define settings with zod

```ts
import z from 'zod';
import {
  ChannelSetting,
  createSettingGroup,
  buildSettingSeedsFromSchema,
} from '@hexabot-ai/api';

export const ACME_CHANNEL_NAME = 'acme' as const;

export const ACME_CHANNEL_SETTINGS_SCHEMA = z.strictObject({
  api_key: z.string().default('').meta({ title: 'API key' }),
  verify_token: z.string().default('').meta({ title: 'Verify token' }),
});

declare global {
  interface RuntimeSettingRegistry {
    [ACME_CHANNEL_NAME]: typeof ACME_CHANNEL_SETTINGS_SCHEMA;
  }
}

export const AcmeChannelSettingsGroup = createSettingGroup({
  group: ACME_CHANNEL_NAME,
  schema: ACME_CHANNEL_SETTINGS_SCHEMA,
  scope: 'extension',
  extensionType: 'channel',
  extensionName: ACME_CHANNEL_NAME,
});

export const ACME_CHANNEL_SETTINGS = buildSettingSeedsFromSchema(
  ACME_CHANNEL_NAME,
  ACME_CHANNEL_SETTINGS_SCHEMA,
  { subgroup: 'channel' },
) as ChannelSetting<typeof ACME_CHANNEL_NAME>[];

export default AcmeChannelSettingsGroup;
```

### 3) Add channel attribute typing

```ts
import { ACME_CHANNEL_NAME } from './acme-channel.settings';

declare global {
  interface SubscriberChannelDict {
    [ACME_CHANNEL_NAME]: {
      tenantId: string;
    };
  }
}
```

### 4) Implement a handler (`*.channel.ts`)

```ts
import {
  ActionOptions,
  IncomingMessageType,
  StdOutgoingMessageEnvelope,
} from '@hexabot-ai/types';
import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import {
  ChannelInboundEvent,
  ChannelInboundEventContext,
  HttpChannelHandler,
  MessageInboundEvent,
  SubscriberCreateDto,
  SyntheticMessageInboundEvent,
} from '@hexabot-ai/api';

import { ACME_CHANNEL_NAME } from './acme-channel.settings';
import { acmeEventSchema } from './types';

@Injectable()
export default class AcmeChannelHandler extends HttpChannelHandler<
  typeof ACME_CHANNEL_NAME
> {
  constructor() {
    super(ACME_CHANNEL_NAME);
  }

  protected async decode(
    req: Request,
  ): Promise<ChannelInboundEvent<typeof ACME_CHANNEL_NAME>[]> {
    const payload = acmeEventSchema.parse(req.body);

    return [
      new SyntheticMessageInboundEvent(
        new ChannelInboundEventContext(
          this.getName(),
          payload,
          { tenantId: payload.tenantId },
          new Date(payload.timestamp),
          payload.id,
          payload.senderId,
          null,
        ),
        {
          type: IncomingMessageType.text,
          data: { text: payload.text },
        },
        IncomingMessageType.text,
      ),
    ];
  }

  protected async doSendMessage(
    _event: MessageInboundEvent<typeof ACME_CHANNEL_NAME>,
    _envelope: StdOutgoingMessageEnvelope,
    _options: ActionOptions,
  ): Promise<{ mid: string }> {
    // Call Acme API here
    return { mid: `${Date.now()}` };
  }

  async getSubscriberData(
    event: MessageInboundEvent<typeof ACME_CHANNEL_NAME>,
  ): Promise<SubscriberCreateDto> {
    return {
      foreignId: event.getSenderForeignId(),
      firstName: 'Acme',
      lastName: 'User',
      channel: event.getChannelData(),
      labels: [],
      assignedTo: null,
      assignedAt: null,
      lastvisit: new Date(),
      retainedFrom: new Date(),
      avatar: null,
      language: '',
      locale: '',
      timezone: 0,
      gender: 'male',
      country: '',
    };
  }
}
```

### 5) Validate inbound payloads with zod

```ts
import z from 'zod';

export const acmeEventSchema = z.strictObject({
  id: z.string(),
  timestamp: z.number(),
  senderId: z.string(),
  tenantId: z.string(),
  text: z.string(),
});
```

## Practical Notes

- Keep channel `name`, settings group key, and extension name aligned (same kebab-case literal).
- Always parse unknown inbound payloads with zod before converting to internal events.
- Use `ChannelCapabilities` to prevent unsupported outgoing message types from being sent.
- Prefer `@ExtensionInject()` when helper services need per-channel binding.
- If you override attachment URL/download behavior, keep `/webhook/:channel/download/:name?t=<jwt>` compatibility in mind.
