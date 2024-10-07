import { OnEventOptions } from '@nestjs/event-emitter/dist/interfaces';
import { Socket } from 'socket.io';

import { BotStats } from '@/analytics/schemas/bot-stats.schema';
import { Attachment } from '@/attachment/schemas/attachment.schema';
import { Block, BlockFull } from '@/chat/schemas/block.schema';
import { Category } from '@/chat/schemas/category.schema';
import { ContextVar } from '@/chat/schemas/context-var.schema';
import { Conversation } from '@/chat/schemas/conversation.schema';
import { Label } from '@/chat/schemas/label.schema';
import { Message } from '@/chat/schemas/message.schema';
import { Subscriber } from '@/chat/schemas/subscriber.schema';
import { ContentType } from '@/cms/schemas/content-type.schema';
import { Content } from '@/cms/schemas/content.schema';
import { Menu } from '@/cms/schemas/menu.schema';
import { Language } from '@/i18n/schemas/language.schema';
import { Translation } from '@/i18n/schemas/translation.schema';
import { NlpEntity } from '@/nlp/schemas/nlp-entity.schema';
import { NlpSampleEntity } from '@/nlp/schemas/nlp-sample-entity.schema';
import { NlpSample } from '@/nlp/schemas/nlp-sample.schema';
import { NlpValue } from '@/nlp/schemas/nlp-value.schema';
import { Setting } from '@/setting/schemas/setting.schema';
import { Invitation } from '@/user/schemas/invitation.schema';
import { Model } from '@/user/schemas/model.schema';
import { Permission } from '@/user/schemas/permission.schema';
import { Role } from '@/user/schemas/role.schema';
import { User } from '@/user/schemas/user.schema';
import { EHook } from '@/utils/generics/base-repository';

import { SubscriberUpdateDto } from './chat/dto/subscriber.dto';

import '@nestjs/event-emitter';

/**
 * @description Module declaration that extends the NestJS EventEmitter with custom event types and methods.
 */
declare module '@nestjs/event-emitter' {
  interface TDefinition<S, O = object> {
    schema: S;
    operations: O;
  }
  interface IHookOperationMap {
    analytics: TDefinition<
      object,
      {
        block: BlockFull;
        passation: Subscriber;
        'fallback-local': BlockFull;
        'fallback-global': any;
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
    nlp: TDefinition<object, { settings: unknown }>;
    websocket: TDefinition<
      object,
      {
        connection: Socket;
      }
    >;
  }
  interface IHookEntityOperationMap extends IHookOperationMap {
    stats: TDefinition<BotStats, { entry: string }>;
    attachment: TDefinition<Attachment>;
    block: TDefinition<Block>;
    category: TDefinition<Category>;
    contextVar: TDefinition<ContextVar>;
    conversation: TDefinition<Conversation, { end: unknown; close: unknown }>;
    label: TDefinition<
      Label,
      { create: THydratedDocument<Label>; delete: Label[] }
    >;
    message: TDefinition<Message>;
    subscriber: TDefinition<Subscriber, { assign: SubscriberUpdateDto }>;
    contentType: TDefinition<ContentType>;
    content: TDefinition<Content>;
    menu: TDefinition<Menu>;
    language: TDefinition<Language, { delete: unknown }>;
    translation: TDefinition<Translation>;
    nlpEntity: TDefinition<
      NlpEntity,
      {
        create: NlpEntity;
        update: NlpEntity;
        delete: NlpEntity;
      }
    >;
    nlpSampleEntity: TDefinition<NlpSampleEntity>;
    nlpSample: TDefinition<NlpSample>;
    nlpValue: TDefinition<
      NlpValue,
      { create: NlpValue; update: NlpValue; delete: unknown }
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

  type TCompatibleHook<
    P extends 'pre' | 'post',
    T = `${EHook}`,
  > = T extends `${P}${infer I}` ? `${P}${I}` : never;

  type TPreHook = TCompatibleHook<'pre'>;
  type TPostHook = TCompatibleHook<'post'>;

  type hookTypes = '*' | TPreHook | TPostHook;

  /* hooks values  */
  type TPostValidate<T> = THydratedDocument<T>;
  type TPostCreate<T> = THydratedDocument<T>;
  type TPostUpdate<T> = THydratedDocument<T>;
  type TPostDelete = {
    acknowledged: boolean;
    deletedCount: number;
  };
  type TPost<T> = TPostValidate<T> &
    TPostCreate<T> &
    TPostUpdate<T> &
    TPostDelete;

  type EventNamespaces = keyof IHookEntityOperationMap;

  type EventValueOf<G> = G extends EventNamespaces
    ? IHookEntityOperationMap[G]
    : G extends `hook:${infer N}:${hookTypes}`
      ? IHookEntityOperationMap[N]['schema']
      : G extends `hook:${infer N}:${infer O}`
        ? IHookEntityOperationMap[N]['operations'][O]
        : any;

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
      : `hook:${G}:${hookTypes | keyof IHookEntityOperationMap[G]['operations']}`
    : never;

  export interface ListenerFn<G extends EventNamespaces | ConstrainedString> {
    (value: EventValueOf<G>, ...values: any[]): void;
  }

  export class EventEmitter2 {
    emit<G extends EventNamespaces | ConstrainedString>(
      customEvent: customEvent<G>,
      value: EventValueOf<G>,
      ...values: any[]
    ): boolean;

    emitAsync<G extends EventNamespaces | ConstrainedString>(
      customEvent: customEvent<G>,
      value: EventValueOf<G>,
      ...values: any[]
    ): Promise<any[]>;

    addListener<G extends EventNamespaces | ConstrainedString>(
      customEvent: customEvent<G>,
      listener: ListenerFn<G>,
    ): this | Listener;

    on<G extends EventNamespaces | ConstrainedString>(
      customEvent: customEvent<G>,
      listener: ListenerFn<G>,
      options?: boolean | OnOptions,
    ): this | Listener;

    once<G extends EventNamespaces | ConstrainedString>(
      customEvent: customEvent<G>,
      listener: ListenerFn<G>,
      options?: true | OnOptions,
    ): this | Listener;

    prependOnceListener<G extends EventNamespaces | ConstrainedString>(
      customEvent: customEvent<G>,
      listener: ListenerFn<G>,
      options?: boolean | OnOptions,
    ): this | Listener;

    many<G extends EventNamespaces | ConstrainedString>(
      customEvent: customEvent<G>,
      timesToListen: number,
      listener: ListenerFn<G>,
      options?: boolean | OnOptions,
    ): this | Listener;

    prependMany<G extends EventNamespaces | ConstrainedString>(
      customEvent: customEvent<G>,
      timesToListen: number,
      listener: ListenerFn<G>,
      options?: boolean | OnOptions,
    ): this | Listener;

    removeListener<G extends EventNamespaces | ConstrainedString>(
      customEvent: customEvent<G>,
      listener: ListenerFn<G>,
    ): this;

    off<G extends EventNamespaces | ConstrainedString>(
      customEvent: customEvent<G>,
      listener: ListenerFn<G>,
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
  >(
    event: customEvent<G>,
    options?: OnEventOptions | undefined,
  ): OnEventMethodDecorator<G>;
}
