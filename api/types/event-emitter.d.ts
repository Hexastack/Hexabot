/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { type OnEventOptions } from '@nestjs/event-emitter/dist/interfaces';
import { type Session as ExpressSession } from 'express-session';
import type { Document, Query } from 'mongoose';
import { type Socket } from 'socket.io';

import { type BotStats } from '@/analytics/schemas/bot-stats.schema';
import { type Attachment } from '@/attachment/schemas/attachment.schema';
import type EventWrapper from '@/channel/lib/EventWrapper';
import { type SubscriberUpdateDto } from '@/chat/dto/subscriber.dto';
import type { Block, BlockFull } from '@/chat/schemas/block.schema';
import { type Category } from '@/chat/schemas/category.schema';
import { type ContextVar } from '@/chat/schemas/context-var.schema';
import { type Conversation } from '@/chat/schemas/conversation.schema';
import type { Label } from '@/chat/schemas/label.schema';
import { type Message } from '@/chat/schemas/message.schema';
import { type Subscriber } from '@/chat/schemas/subscriber.schema';
import { type ContentType } from '@/cms/schemas/content-type.schema';
import { type Content } from '@/cms/schemas/content.schema';
import { type Menu } from '@/cms/schemas/menu.schema';
import { type Language } from '@/i18n/schemas/language.schema';
import { type Translation } from '@/i18n/schemas/translation.schema';
import type { NlpEntity } from '@/nlp/schemas/nlp-entity.schema';
import { type NlpSampleEntity } from '@/nlp/schemas/nlp-sample-entity.schema';
import { type NlpSample } from '@/nlp/schemas/nlp-sample.schema';
import type { NlpValue } from '@/nlp/schemas/nlp-value.schema';
import { type Setting } from '@/setting/schemas/setting.schema';
import { type Invitation } from '@/user/schemas/invitation.schema';
import { type Model } from '@/user/schemas/model.schema';
import { type Permission } from '@/user/schemas/permission.schema';
import { type Role } from '@/user/schemas/role.schema';
import { type User } from '@/user/schemas/user.schema';
import { EHook, type DeleteResult } from '@/utils/generics/base-repository';
import type {
  TFilterQuery,
  THydratedDocument,
} from '@/utils/types/filter.types';

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

  /* pre hooks */
  type TPreCreateValidate<T> = THydratedDocument<T>;

  type TPreCreate<T> = THydratedDocument<T>;

  type TPreUpdateValidate<T> = FilterQuery<T>;

  type TPreUpdate<T> = TFilterQuery<T>;

  type TPreDelete<T> = Query<
    DeleteResult,
    Document<T>,
    unknown,
    T,
    'deleteOne',
    Record<string, never>
  >;

  type TPreUnion<T> =
    | TPreCreateValidate<T>
    | TPreCreate<T>
    | TPreUpdateValidate<T>
    | TPreUpdate<T>
    | TPreDelete<T>;

  /* post hooks */
  type TPostCreateValidate<T> = THydratedDocument<T>;

  type TPostCreate<T> = THydratedDocument<T>;

  type TPostUpdateValidate<T> = FilterQuery<T>;

  // TODO this type will be optimized soon in a separated PR
  type TPostUpdate<T> = T & any;

  type TPostDelete = DeleteResult;

  type TPostUnion<T> =
    | TPostCreateValidate<T>
    | TPostCreate<T>
    | TPostUpdateValidate<T>
    | TPostUpdate<T>
    | TPostDelete;

  type TCustomOperations<E extends keyof IHookEntityOperationMap> =
    IHookEntityOperationMap[E]['operations'][keyof IHookEntityOperationMap[E]['operations']];

  /* union hooks */
  type TUnion<G, E> = E extends keyof IHookEntityOperationMap
    ? E extends keyof IHookOperationMap
      ? TCustomOperations<E>
      : TPreUnion<G> | TPostUnion<G> | TCustomOperations<E>
    : never;

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

  type TNormalizedHooks<
    E extends keyof IHookEntityOperationMap,
    T = IHookEntityOperationMap[E]['schema'],
  > =
    | {
        [EHook.preCreateValidate]: TPreCreateValidate<T>;
      }
    | {
        [EHook.preCreate]: TPreCreate<T>;
      }
    | {
        [EHook.preUpdateValidate]: TPreUpdateValidate<T>;
      }
    | {
        [EHook.preUpdate]: TPreUpdate<T>;
      }
    | {
        [EHook.preDelete]: TPreDelete<T>;
      }
    | {
        [EHook.postCreateValidate]: TPostCreateValidate<T>;
      }
    | {
        [EHook.postCreate]: TPostCreate<T>;
      }
    | {
        [EHook.postUpdateValidate]: TPostUpdateValidate<T>;
      }
    | {
        [EHook.postUpdate]: TPostUpdate<T>;
      }
    | {
        [EHook.postDelete]: TPostDelete;
      };

  type TNormalizedHook<E extends keyof IHookEntityOperationMap, O> = Extract<
    TNormalizedHooks<E>,
    { [key in O]: unknown }
  >[O];

  /* Extended hook */
  type TExtendedHook<
    E extends keyof IHookEntityOperationMap,
    O extends keyof IHookEntityOperationMap[E]['operations'],
  > = IHookEntityOperationMap[E]['operations'][O];

  type EventValueOf<G> = G extends `hook:${infer E}:${infer O}`
    ? O extends '*'
      ? TUnion<G, E>
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
