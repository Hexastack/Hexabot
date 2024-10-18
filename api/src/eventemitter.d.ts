import { type OnEventOptions } from '@nestjs/event-emitter/dist/interfaces';
import type { TFilterQuery, HydratedDocument, Query, Document } from 'mongoose';
import { type Socket } from 'socket.io';

import { type BotStats } from '@/analytics/schemas/bot-stats.schema';
import { type Attachment } from '@/attachment/schemas/attachment.schema';
import type EventWrapper from '@/channel/lib/EventWrapper';
import { type Block, BlockFull } from '@/chat/schemas/block.schema';
import { type Category } from '@/chat/schemas/category.schema';
import { type ContextVar } from '@/chat/schemas/context-var.schema';
import { type Conversation } from '@/chat/schemas/conversation.schema';
import { LabelDocument, type Label } from '@/chat/schemas/label.schema';
import { type Message } from '@/chat/schemas/message.schema';
import { type Subscriber } from '@/chat/schemas/subscriber.schema';
import { type ContentType } from '@/cms/schemas/content-type.schema';
import { type Content } from '@/cms/schemas/content.schema';
import { type Menu } from '@/cms/schemas/menu.schema';
import { type Language } from '@/i18n/schemas/language.schema';
import { type Translation } from '@/i18n/schemas/translation.schema';
import type {
  NlpEntity,
  NlpEntityDocument,
} from '@/nlp/schemas/nlp-entity.schema';
import { type NlpSampleEntity } from '@/nlp/schemas/nlp-sample-entity.schema';
import { type NlpSample } from '@/nlp/schemas/nlp-sample.schema';
import {
  NlpValueDocument,
  type NlpValue,
} from '@/nlp/schemas/nlp-value.schema';
import { type Setting } from '@/setting/schemas/setting.schema';
import type { CheckboxSetting, TextSetting } from '@/setting/schemas/types';
import { type Invitation } from '@/user/schemas/invitation.schema';
import { type Model } from '@/user/schemas/model.schema';
import { type Permission } from '@/user/schemas/permission.schema';
import { type Role } from '@/user/schemas/role.schema';
import { type User } from '@/user/schemas/user.schema';
import { EHook, type DeleteResult } from '@/utils/generics/base-repository';

import { type SubscriberUpdateDto } from './chat/dto/subscriber.dto';

import '@nestjs/event-emitter';
/**
 * @description Module declaration that extends the NestJS EventEmitter with custom event types and methods.
 */
declare module '@nestjs/event-emitter' {
  interface TDefinition<S, O = object> {
    schema: S;
    operations: O;
  }

  interface IHookExtensionsOperationMap {
    messenger: TDefinition<
      object,
      {
        get_started_button: Setting;
        access_token: Setting;
        composer_input_disabled: CheckboxSetting;
        greeting_text: TextSetting;
      }
    >;
  }

  interface IHookSettingsGroupLabelOperationMap {
    chatbot_settings: TDefinition<
      object,
      {
        global_fallback: unknown;
        fallback_block: unknown;
        fallback_message: unknown;
      }
    >;
    contact: TDefinition<
      object,
      {
        contact_email_recipient: unknown;
        company_name: unknown;
        company_phone: unknown;
        company_email: unknown;
        company_address1: unknown;
        company_address2: unknown;
        company_city: unknown;
        company_zipcode: unknown;
        company_state: unknown;
        company_country: unknown;
      }
    >;
    nlu: TDefinition<
      object,
      {
        provider: unknown;
        endpoint: unknown;
        token: unknown;
        threshold: number;
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
      }
    >;
    websocket: TDefinition<
      object,
      {
        connection: Socket;
      }
    >;
  }

  /* entities hooks */
  interface IHookEntityOperationMap extends IHookOperationMap {
    stats: TDefinition<BotStats, { entry: string }>;
    attachment: TDefinition<Attachment>;
    block: TDefinition<Block>;
    category: TDefinition<Category>;
    contextVar: TDefinition<ContextVar>;
    conversation: TDefinition<Conversation, { end: unknown; close: unknown }>;
    label: TDefinition<
      Label,
      { create: LabelDocument; delete: Label | Label[] }
    >;
    message: TDefinition<Message>;
    subscriber: TDefinition<Subscriber, { assign: SubscriberUpdateDto }>;
    contentType: TDefinition<ContentType>;
    content: TDefinition<Content>;
    menu: TDefinition<Menu>;
    language: TDefinition<Language, { delete: Language | Language[] }>;
    translation: TDefinition<Translation>;
    nlpEntity: TDefinition<
      NlpEntity,
      {
        create: NlpEntityDocument;
        update: NlpEntity;
        delete: NlpEntity | NlpEntity[];
      }
    >;
    nlpSampleEntity: TDefinition<NlpSampleEntity>;
    nlpSample: TDefinition<NlpSample>;
    nlpValue: TDefinition<
      NlpValue,
      {
        create: NlpValueDocument;
        update: NlpValue;
        delete: NlpValue | NlpValue[];
      }
    >;
    setting: TDefinition<Setting>;
    invitation: TDefinition<Invitation>;
    model: TDefinition<Model>;
    permission: TDefinition<Permission>;
    role: TDefinition<Role>;
    user: TDefinition<User, { lastvisit: Subscriber }>;
  }

  /**
   * @description A constrained string type that allows specific string values while preserving type safety.
   */
  type ConstrainedString = string & Record<never, never>;
  type EventNamespaces = keyof IHookEntityOperationMap;

  /* pre hooks */
  type TPreValidate<T> = HydratedDocument<T>;
  type TPreCreate<T> = HydratedDocument<T>;
  type TPreUpdate<T> = TFilterQuery<T> & object;
  type TPreDelete = Query<
    DeleteResult,
    Document<T>,
    unknown,
    T,
    'deleteOne',
    Record<string, never>
  >;
  type TPreUnion<T> =
    | TPreValidate<T>
    | TPreCreate<T>
    | TPreUpdate<T>
    | TPreDelete;

  /* post hooks */
  type TPostValidate<T> = HydratedDocument<T>;
  type TPostCreate<T> = HydratedDocument<T>;
  type TPostUpdate<T> = HydratedDocument<T>;
  type TPostDelete = DeleteResult;
  type TPostUnion<T> =
    | TPostValidate<T>
    | TPostCreate<T>
    | TPostUpdate<T>
    | TPostDelete;

  /* union hooks */
  type TUnion<G, E> = E extends keyof IHookOperationMap
    ? IHookEntityOperationMap[E]['operations'][keyof IHookEntityOperationMap[E]['operations']]
    :
        | TPreUnion<G>
        | TPostUnion<G>
        | IHookEntityOperationMap[E]['operations'][keyof IHookEntityOperationMap[E]['operations']];

  type THookSplitter<H> = H extends `hook:${infer E}:${infer O}`
    ? [E, O]
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

  type hookTypes<O = never> = O extends keyof IHookOperationMap
    ? '*'
    : '*' | TPreHook | TPostHook;

  type TNormalizedPreHook<E, O> = O extends `${EHook.preValidate}`
    ? TPreValidate<IHookEntityOperationMap[E]['schema']>
    : O extends `${EHook.preCreate}`
      ? TPreCreate<IHookEntityOperationMap[E]['schema']>
      : O extends `${EHook.preUpdate}`
        ? TPreUpdate<IHookEntityOperationMap[E]['schema']>
        : O extends `${EHook.preDelete}`
          ? TPreDelete
          : never;
  type TNormalizedPostHook<E, O> = O extends `${EHook.postValidate}`
    ? TPostValidate<IHookEntityOperationMap[E]['schema']>
    : O extends `${EHook.postCreate}`
      ? TPostCreate<IHookEntityOperationMap[E]['schema']>
      : O extends `${EHook.postUpdate}`
        ? TPostUpdate<IHookEntityOperationMap[E]['schema']>
        : O extends `${EHook.postDelete}`
          ? TPostDelete
          : never;
  type TNormalizedHook<E, O> = TNormalizedPreHook<E, O> &
    TNormalizedPostHook<E, O>;

  /* Extended hook */
  type TExtendedHook<E, O> = IHookEntityOperationMap[E]['operations'][O];

  type EventValueOf<
    G,
    E = THookSplitter<G>[0],
    O = THookSplitter<G>[1],
  > = O extends '*'
    ? TUnion<G, E>
    : O extends hookTypes
      ? TNormalizedHook<E, O>
      : TExtendedHook<E, O>;

  type IsHookEvent<G extends EventNamespaces> = G extends EventNamespaces
    ? true
    : G extends `hook:${infer N}:${string}`
      ? N extends keyof IHookEntityOperationMap
        ? true
        : false
      : false;

  type customEvent<G extends EventNamespaces> = G extends EventNamespaces
    ? G extends `hook:${string}`
      ? G
      : `hook:${G}:${hookTypes<G> | keyof IHookEntityOperationMap[G]['operations']}`
    : never;

  export interface ListenerFn<G extends EventNamespaces | ConstrainedString> {
    (value: EventValueOf<G>, ...values: any[]): void;
  }

  export class EventEmitter2 {
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

  export declare function OnEvent<
    G extends EventNamespaces | ConstrainedString,
    H extends G,
  >(
    event: customEvent<G>,
    options?: OnEventOptions | undefined,
  ): OnEventMethodDecorator<H>;
}
