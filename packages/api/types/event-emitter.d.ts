/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { type OnEventOptions } from '@nestjs/event-emitter/dist/interfaces';
import { type Session as ExpressSession } from 'express-session';
import { type Socket } from 'socket.io';
import type { InsertEvent, RemoveEvent, UpdateEvent } from 'typeorm';

import type { BotStats } from '@/analytics/dto/bot-stats.dto';
import type { Attachment } from '@/attachment/dto/attachment.dto';
import type EventWrapper from '@/channel/lib/EventWrapper';
import { type SubscriberUpdateDto } from '@/chat/dto/subscriber.dto';
import type { Block, BlockFull } from '@/chat/dto/block.dto';
import type { Category } from '@/chat/dto/category.dto';
import type { ContextVar } from '@/chat/dto/context-var.dto';
import type { Conversation } from '@/chat/dto/conversation.dto';
import type { Label } from '@/chat/dto/label.dto';
import type { Message } from '@/chat/dto/message.dto';
import type { Subscriber } from '@/chat/dto/subscriber.dto';
import type { Content } from '@/cms/dto/content.dto';
import type { ContentType } from '@/cms/dto/contentType.dto';
import type { Menu } from '@/cms/dto/menu.dto';
import type { Language } from '@/i18n/dto/language.dto';
import type { Translation } from '@/i18n/dto/translation.dto';
import type { NlpEntity } from '@/nlp/dto/nlp-entity.dto';
import type { NlpSampleEntity } from '@/nlp/dto/nlp-sample-entity.dto';
import type { NlpSample } from '@/nlp/dto/nlp-sample.dto';
import type { NlpValue } from '@/nlp/dto/nlp-value.dto';
import type { Metadata } from '@/setting/dto/metadata.dto';
import type { Setting } from '@/setting/dto/setting.dto';
import type { Invitation } from '@/user/dto/invitation.dto';
import type { Model } from '@/user/dto/model.dto';
import type { Permission } from '@/user/dto/permission.dto';
import type { Role } from '@/user/dto/role.dto';
import { type User } from '@/user/dto/user.dto';
import { EHook } from '@/utils/generics/base-repository';

import '@nestjs/event-emitter';
/**
 * @description Module declaration that extends the NestJS EventEmitter with custom event types and methods.
 */
declare module '@nestjs/event-emitter' {
  interface TDefinition<S, O = object> {
    schema: S;
    operations: O;
  }

  interface IHookExtensionsOperationMap {}

  interface IHookSettingsGroupLabelOperationMap {
    chatbot_settings: TDefinition<
      object,
      {
        global_fallback: Setting;
        fallback_block: Setting;
        fallback_message: Setting;
      }
    >;
    contact: TDefinition<
      object,
      {
        contact_email_recipient: Setting;
        company_name: Setting;
        company_phone: Setting;
        company_email: Setting;
        company_address1: Setting;
        company_address2: Setting;
        company_city: Setting;
        company_zipcode: Setting;
        company_state: Setting;
        company_country: Setting;
      }
    >;
  }

  /* custom hooks */
  interface IHookOperationMap
    extends IHookSettingsGroupLabelOperationMap,
      IHookExtensionsOperationMap {
    analytics: TDefinition<
      object,
      {
        block: BlockFull;
        passation: Subscriber;
        'fallback-local': BlockFull;
        'fallback-global': EventWrapper<any, any>;
        intervention: Subscriber;
      }
    >;
    chatbot: TDefinition<
      object,
      {
        sent: unknown;
        received: unknown;
        message: unknown;
        delivery: unknown;
        read: unknown;
        typing: unknown;
        follow: unknown;
        echo: unknown;
        error: unknown;
      }
    >;
    websocket: TDefinition<
      object,
      {
        connection: Socket;
        //TODO: error need to be typed as a function
        error: unknown;
      }
    >;
  }

  /* hooks */
  interface IHookEntityOperationMap extends IHookOperationMap {
    stats: TDefinition<BotStats, { entry: string }>;
    attachment: TDefinition<Attachment>;
    block: TDefinition<Block>;
    category: TDefinition<Category>;
    contextVar: TDefinition<ContextVar>;
    conversation: TDefinition<Conversation, { end: unknown; close: unknown }>;
    label: TDefinition<Label>;
    message: TDefinition<Message>;
    subscriber: TDefinition<Subscriber, { assign: SubscriberUpdateDto }>;
    contentType: TDefinition<ContentType>;
    content: TDefinition<Content>;
    menu: TDefinition<Menu>;
    language: TDefinition<Language>;
    translation: TDefinition<Translation>;
    nlpEntity: TDefinition<NlpEntity>;
    nlpSampleEntity: TDefinition<NlpSampleEntity>;
    nlpSample: TDefinition<NlpSample>;
    nlpValue: TDefinition<NlpValue>;
    setting: TDefinition<Setting>;
    metadata: TDefinition<Metadata>;
    invitation: TDefinition<Invitation>;
    model: TDefinition<Model>;
    permission: TDefinition<Permission>;
    role: TDefinition<Role>;
    user: TDefinition<User, { lastvisit: Subscriber; logout: ExpressSession }>;
  }

  /* entities hooks having schemas */
  type IHookEntities = keyof Omit<
    IHookEntityOperationMap,
    keyof IHookOperationMap
  >;

  /**
   * @description A constrained string type that allows specific string values while preserving type safety.
   */
  type ConstrainedString = string & Record<never, never>;

  type EventNamespaces = keyof IHookEntityOperationMap;

  type TCustomOperations<E extends keyof IHookEntityOperationMap> =
    IHookEntityOperationMap[E]['operations'][keyof IHookEntityOperationMap[E]['operations']];

  type TLifecycleHookMap<T> = {
    [EHook.preCreate]: InsertEvent<T>;
    [EHook.postCreate]: InsertEvent<T>;
    [EHook.preUpdate]: UpdateEvent<T>;
    [EHook.postUpdate]: UpdateEvent<T>;
    [EHook.preDelete]: RemoveEvent<T>;
    [EHook.postDelete]: RemoveEvent<T>;
  };

  type TLifecycleHookKey = keyof TLifecycleHookMap<unknown>;

  type TLifecycleHookValue<T> =
    TLifecycleHookMap<T>[keyof TLifecycleHookMap<T>];

  /* Normalized hook */
  enum EHookPrefix {
    pre = 'pre',
    post = 'post',
  }

  type TCompatibleHook<
    P extends `${EHookPrefix}`,
    T = `${EHook}`,
  > = T extends `${P}${infer I}` ? `${P}${I}` : never;

  type TPreHook = TCompatibleHook<EHookPrefix.pre>;

  type TPostHook = TCompatibleHook<EHookPrefix.post>;

  type TNormalizedEvents = '*' | TPreHook | TPostHook;

  type TNormalizedHook<
    E extends keyof IHookEntityOperationMap,
    O,
  > = O extends TLifecycleHookKey
    ? TLifecycleHookMap<IHookEntityOperationMap[E]['schema']>[O]
    : never;

  /* Extended hook */
  type TExtendedHook<
    E extends keyof IHookEntityOperationMap,
    O extends keyof IHookEntityOperationMap[E]['operations'],
  > = IHookEntityOperationMap[E]['operations'][O];

  type EventValueOf<G> = G extends `hook:${infer E}:${infer O}`
    ? O extends '*'
      ? E extends keyof IHookEntityOperationMap
        ? E extends keyof IHookOperationMap
          ? TCustomOperations<E>
          :
              | TLifecycleHookValue<IHookEntityOperationMap[E]['schema']>
              | TCustomOperations<E>
        : never
      : E extends keyof IHookEntityOperationMap
        ? O extends keyof IHookEntityOperationMap[E]['operations']
          ? TExtendedHook<E, O>
          : TNormalizedHook<E, O>
        : never
    : never;

  type IsHookEvent<G extends EventNamespaces | ConstrainedString> =
    G extends EventNamespaces
      ? true
      : G extends `hook:${infer N}:${string}`
        ? N extends keyof IHookEntityOperationMap
          ? true
          : false
        : false;

  type TCustomEvents<G extends keyof IHookEntityOperationMap> =
    | '*'
    | keyof IHookEntityOperationMap[G]['operations'];

  type TNormalizedOrCustomized<G> = G extends IHookEntities
    ? TNormalizedEvents | TCustomEvents<G>
    : TCustomEvents<G>;

  type customEvent<G extends EventNamespaces | ConstrainedString> =
    G extends EventNamespaces
      ? G extends `hook:${string}`
        ? G
        : `hook:${G}:${TNormalizedOrCustomized<G>}`
      : never;

  type TEventName = Exclude<
    customEvent<EventNamespaces | ConstrainedString>,
    `${string}:*`
  >;

  interface ListenerFn<G extends EventNamespaces | ConstrainedString> {
    (value: EventValueOf<G>, ...values: any[]): void;
  }

  class EventEmitter2 {
    constructor(options?: ConstructorOptions);

    emit<G extends EventNamespaces | ConstrainedString, H extends G>(
      customEvent: customEvent<G>,
      value: EventValueOf<H>,
      ...values: any[]
    ): boolean;

    emitAsync<G extends EventNamespaces | ConstrainedString, H extends G>(
      customEvent: customEvent<G>,
      value: EventValueOf<H>,
      ...values: any[]
    ): Promise<any[]>;

    addListener<G extends EventNamespaces | ConstrainedString, H extends G>(
      customEvent: customEvent<G>,
      listener: ListenerFn<H>,
    ): this | Listener;

    on<G extends EventNamespaces | ConstrainedString, H extends G>(
      customEvent: customEvent<G>,
      listener: ListenerFn<H>,
      options?: boolean | OnOptions,
    ): this | Listener;

    once<G extends EventNamespaces | ConstrainedString, H extends G>(
      customEvent: customEvent<G>,
      listener: ListenerFn<H>,
      options?: true | OnOptions,
    ): this | Listener;

    prependOnceListener<
      G extends EventNamespaces | ConstrainedString,
      H extends G,
    >(
      customEvent: customEvent<G>,
      listener: ListenerFn<H>,
      options?: boolean | OnOptions,
    ): this | Listener;

    many<G extends EventNamespaces | ConstrainedString, H extends G>(
      customEvent: customEvent<G>,
      timesToListen: number,
      listener: ListenerFn<H>,
      options?: boolean | OnOptions,
    ): this | Listener;

    prependMany<G extends EventNamespaces | ConstrainedString, H extends G>(
      customEvent: customEvent<G>,
      timesToListen: number,
      listener: ListenerFn<H>,
      options?: boolean | OnOptions,
    ): this | Listener;

    removeListener<G extends EventNamespaces | ConstrainedString, H extends G>(
      customEvent: customEvent<G>,
      listener: ListenerFn<H>,
    ): this;

    off<G extends EventNamespaces | ConstrainedString, H extends G>(
      customEvent: customEvent<G>,
      listener: ListenerFn<H>,
    ): this;

    readonly event: TEventName;
  }

  declare type OnEventMethodDecorator<
    G extends EventNamespaces | ConstrainedString,
  > = <T, K extends keyof T>(
    target: IsHookEvent<G> extends true
      ? [T[K]] extends [(params: EventValueOf<G>, ...rest: any[]) => any]
        ? T
        : never
      : T,
    propertyKey: K,
  ) => void;

  declare function OnEvent<
    G extends EventNamespaces | ConstrainedString,
    H extends G,
  >(event: customEvent<G>, options?: OnEventOptions): OnEventMethodDecorator<H>;
}
