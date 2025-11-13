/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type {
  BotStatsOrmEntity,
  BotStatsType,
} from '@hexabot/analytics/entities/bot-stats.entity';
import type { THydratedDocument } from '@hexabot/core/types';
import type { Setting } from '@hexabot/setting/dto/setting.dto';
import type { MetadataOrmEntity } from '@hexabot/setting/entities/metadata.entity';
import type { SettingOrmEntity } from '@hexabot/setting/entities/setting.entity';
import type { DEFAULT_SETTINGS } from '@hexabot/setting/seeds/setting.seed-model';
import type { HttpException } from '@nestjs/common';
import type { OnEventType } from '@nestjs/event-emitter';
import type { OnEventOptions } from '@nestjs/event-emitter/dist/interfaces';
import type {
  EventEmitter2 as EventEmitter2Base,
  event as EventKey,
  eventNS as EventNamespace,
  Listener,
  ListenerFn,
  OnOptions,
} from 'eventemitter2';
import type { Session as ExpressSession } from 'express-session';
import type { Socket } from 'socket.io';
import type { InsertEvent, RemoveEvent, UpdateEvent } from 'typeorm';

import type { AttachmentOrmEntity } from '@/attachment/entities/attachment.entity';
import type EventWrapper from '@/channel/lib/EventWrapper';
import type { BlockFull } from '@/chat/dto/block.dto';
import type { Conversation } from '@/chat/dto/conversation.dto';
import type { Message, MessageCreateDto } from '@/chat/dto/message.dto';
import type {
  Subscriber,
  SubscriberUpdateDto,
} from '@/chat/dto/subscriber.dto';
import type { BlockOrmEntity } from '@/chat/entities/block.entity';
import type { CategoryOrmEntity } from '@/chat/entities/category.entity';
import type { ContextVarOrmEntity } from '@/chat/entities/context-var.entity';
import type { ConversationOrmEntity } from '@/chat/entities/conversation.entity';
import type { LabelGroupOrmEntity } from '@/chat/entities/label-group.entity';
import type { LabelOrmEntity } from '@/chat/entities/label.entity';
import type { MessageOrmEntity } from '@/chat/entities/message.entity';
import type { SubscriberOrmEntity } from '@/chat/entities/subscriber.entity';
import type { Context } from '@/chat/types/context';
import type { ContentTypeOrmEntity } from '@/cms/entities/content-type.entity';
import type { ContentOrmEntity } from '@/cms/entities/content.entity';
import type { MenuOrmEntity } from '@/cms/entities/menu.entity';
import type { LanguageOrmEntity } from '@/i18n/entities/language.entity';
import type { TranslationOrmEntity } from '@/i18n/entities/translation.entity';
import type { NlpEntityOrmEntity } from '@/nlp/entities/nlp-entity.entity';
import type { NlpSampleEntityOrmEntity } from '@/nlp/entities/nlp-sample-entity.entity';
import type { NlpSampleOrmEntity } from '@/nlp/entities/nlp-sample.entity';
import type { NlpValueOrmEntity } from '@/nlp/entities/nlp-value.entity';
import type { InvitationOrmEntity } from '@/user/entities/invitation.entity';
import type { ModelOrmEntity } from '@/user/entities/model.entity';
import type { PermissionOrmEntity } from '@/user/entities/permission.entity';
import type { RoleOrmEntity } from '@/user/entities/role.entity';
import type { UserOrmEntity } from '@/user/entities/user.entity';
import type { DummyOrmEntity } from '@/utils/test/dummy/entities/dummy.entity';

type AnyEventWrapper = EventWrapper<any, any>;

type DefaultSettingSeed = (typeof DEFAULT_SETTINGS)[number];

type DefaultHookSettingsMap = {
  [Group in DefaultSettingSeed['group']]: Record<
    Extract<DefaultSettingSeed, { group: Group }>['label'],
    Setting
  >;
};

type UnionToIntersection<U> = (
  U extends never ? never : (arg: U) => void
) extends (arg: infer I) => void
  ? I
  : never;

type OrmLifecycleEvent<Entity> =
  | InsertEvent<Entity>
  | UpdateEvent<Entity>
  | RemoveEvent<Entity>;

type InsertHook =
  | 'preCreateValidate'
  | 'preCreate'
  | 'postCreateValidate'
  | 'postCreate';

type UpdateHook =
  | 'preUpdateValidate'
  | 'preUpdate'
  | 'postUpdateValidate'
  | 'postUpdate'
  | 'preUpdateMany'
  | 'postUpdateMany';

type DeleteHook = 'preDelete' | 'postDelete';

type HookEventPayload<
  Entity,
  Hook extends Exclude<TNormalizedEvents, '*'>,
> = Hook extends InsertHook
  ? [InsertEvent<Entity>]
  : Hook extends UpdateHook
    ? [UpdateEvent<Entity>]
    : Hook extends DeleteHook
      ? [RemoveEvent<Entity>]
      : never;

type HookWildcardPayload<Entity> = [OrmLifecycleEvent<Entity>];

declare module '@nestjs/event-emitter' {
  interface IHookSettingsGroupLabelOperationMap
    extends DefaultHookSettingsMap {}

  interface IHookExtensionsOperationMap {
    [namespace: string]: TDefinition;
  }

  type TDefinition<
    TPayload extends object = object,
    TSettings extends Record<string, unknown> = Record<string, unknown>,
  > = {
    payload: TPayload;
    settings: TSettings;
  };

  interface OrmEntityRegistry {
    attachment: AttachmentOrmEntity;
    block: BlockOrmEntity;
    botStats: BotStatsOrmEntity;
    category: CategoryOrmEntity;
    content: ContentOrmEntity;
    contentType: ContentTypeOrmEntity;
    conversation: ConversationOrmEntity;
    contextVar: ContextVarOrmEntity;
    dummy: DummyOrmEntity;
    invitation: InvitationOrmEntity;
    label: LabelOrmEntity;
    labelGroup: LabelGroupOrmEntity;
    language: LanguageOrmEntity;
    menu: MenuOrmEntity;
    metadata: MetadataOrmEntity;
    message: MessageOrmEntity;
    model: ModelOrmEntity;
    nlpEntity: NlpEntityOrmEntity;
    nlpSample: NlpSampleOrmEntity;
    nlpSampleEntity: NlpSampleEntityOrmEntity;
    nlpValue: NlpValueOrmEntity;
    permission: PermissionOrmEntity;
    role: RoleOrmEntity;
    setting: SettingOrmEntity;
    subscriber: SubscriberOrmEntity;
    translation: TranslationOrmEntity;
    user: UserOrmEntity;
  }

  type IHookEntities = keyof OrmEntityRegistry & string;

  type TNormalizedEvents = InsertHook | UpdateHook | DeleteHook | '*';

  type OrmLifecycleEventMap = UnionToIntersection<
    {
      [Entity in keyof OrmEntityRegistry & string]:
        | {
            [Hook in Exclude<
              TNormalizedEvents,
              '*'
            > as `hook:${Entity}:${Hook}`]: HookEventPayload<
              OrmEntityRegistry[Entity],
              Hook
            >;
          }
        | {
            [`hook:${Entity}:*`]: HookWildcardPayload<
              OrmEntityRegistry[Entity]
            >;
          };
    }[keyof OrmEntityRegistry & string]
  >;

  type SettingsEventMap = UnionToIntersection<
    {
      [Group in keyof IHookSettingsGroupLabelOperationMap & string]:
        | {
            [Label in keyof IHookSettingsGroupLabelOperationMap[Group] &
              string as `hook:${Group}:${Label}`]: [
              IHookSettingsGroupLabelOperationMap[Group][Label],
            ];
          }
        | {
            [`hook:${Group}:*`]: [
              IHookSettingsGroupLabelOperationMap[Group][keyof IHookSettingsGroupLabelOperationMap[Group] &
                string],
            ];
          };
    }[keyof IHookSettingsGroupLabelOperationMap & string]
  >;

  interface CustomEventMap {
    'hook:analytics:block': [BlockFull, AnyEventWrapper, Context | undefined];
    'hook:analytics:fallback-local': [
      BlockFull,
      AnyEventWrapper,
      Context | undefined,
    ];
    'hook:analytics:fallback-global': [AnyEventWrapper];
    'hook:analytics:passation': [Subscriber, boolean];
    'hook:chatbot:echo': [AnyEventWrapper];
    'hook:chatbot:delivery': [AnyEventWrapper];
    'hook:chatbot:message': [AnyEventWrapper];
    'hook:chatbot:read': [AnyEventWrapper];
    'hook:chatbot:received': [AnyEventWrapper];
    'hook:chatbot:sent': [MessageCreateDto, AnyEventWrapper?];
    'hook:conversation:close': [string];
    'hook:conversation:end': [Conversation];
    'hook:message:preCreate': [THydratedDocument<Message>];
    'hook:stats:entry': [BotStatsType, string, Subscriber?];
    'hook:subscriber:assign': [SubscriberUpdateDto, Subscriber];
    'hook:user:lastvisit': [Subscriber];
    'hook:user:logout': [ExpressSession];
    'hook:websocket:connection': [Socket];
    'hook:websocket:error': [Socket, Error | HttpException];
  }

  interface IBaseHookEventMap
    extends OrmLifecycleEventMap,
      SettingsEventMap,
      CustomEventMap {}

  interface IHookEventMap extends IBaseHookEventMap {}

  type HookEventKey = keyof IHookEventMap & string;

  type HookEventArgs<K extends HookEventKey> = IHookEventMap[K] extends any[]
    ? IHookEventMap[K]
    : never;

  type HookEventListener<K extends HookEventKey> = (
    ...args: HookEventArgs<K>
  ) => unknown;

  interface EventEmitter2 extends EventEmitter2Base {
    emit<K extends HookEventKey>(
      event: K,
      ...values: HookEventArgs<K>
    ): boolean;
    emit(
      event: EventKey | EventNamespace | Array<EventKey | EventNamespace>,
      ...values: any[]
    ): boolean;

    emitAsync<K extends HookEventKey>(
      event: K,
      ...values: HookEventArgs<K>
    ): Promise<any[]>;
    emitAsync(
      event: EventKey | EventNamespace | Array<EventKey | EventNamespace>,
      ...values: any[]
    ): Promise<any[]>;

    addListener<K extends HookEventKey>(
      event: K,
      listener: HookEventListener<K>,
    ): this | Listener;
    addListener(
      event: EventKey | EventNamespace | Array<EventKey | EventNamespace>,
      listener: ListenerFn,
    ): this | Listener;

    on<K extends HookEventKey>(
      event: K,
      listener: HookEventListener<K>,
      options?: boolean | OnOptions,
    ): this | Listener;
    on(
      event: EventKey | EventNamespace | Array<EventKey | EventNamespace>,
      listener: ListenerFn,
      options?: boolean | OnOptions,
    ): this | Listener;

    once<K extends HookEventKey>(
      event: K,
      listener: HookEventListener<K>,
      options?: true | OnOptions,
    ): this | Listener;
    once(
      event: EventKey | EventNamespace | Array<EventKey | EventNamespace>,
      listener: ListenerFn,
      options?: true | OnOptions,
    ): this | Listener;

    prependListener<K extends HookEventKey>(
      event: K,
      listener: HookEventListener<K>,
      options?: boolean | OnOptions,
    ): this | Listener;
    prependListener(
      event: EventKey | EventNamespace | Array<EventKey | EventNamespace>,
      listener: ListenerFn,
      options?: boolean | OnOptions,
    ): this | Listener;

    prependOnceListener<K extends HookEventKey>(
      event: K,
      listener: HookEventListener<K>,
      options?: boolean | OnOptions,
    ): this | Listener;
    prependOnceListener(
      event: EventKey | EventNamespace | Array<EventKey | EventNamespace>,
      listener: ListenerFn,
      options?: boolean | OnOptions,
    ): this | Listener;

    many<K extends HookEventKey>(
      event: K,
      timesToListen: number,
      listener: HookEventListener<K>,
      options?: boolean | OnOptions,
    ): this | Listener;
    many(
      event: EventKey | EventNamespace | Array<EventKey | EventNamespace>,
      timesToListen: number,
      listener: ListenerFn,
      options?: boolean | OnOptions,
    ): this | Listener;

    prependMany<K extends HookEventKey>(
      event: K,
      timesToListen: number,
      listener: HookEventListener<K>,
      options?: boolean | OnOptions,
    ): this | Listener;
    prependMany(
      event: EventKey | EventNamespace | Array<EventKey | EventNamespace>,
      timesToListen: number,
      listener: ListenerFn,
      options?: boolean | OnOptions,
    ): this | Listener;

    off<K extends HookEventKey>(event: K, listener: HookEventListener<K>): this;
    off(
      event: EventKey | EventNamespace | Array<EventKey | EventNamespace>,
      listener: ListenerFn,
    ): this;

    removeListener<K extends HookEventKey>(
      event: K,
      listener: HookEventListener<K>,
    ): this;
    removeListener(
      event: EventKey | EventNamespace | Array<EventKey | EventNamespace>,
      listener: ListenerFn,
    ): this;
  }

  type OnEventMethodDecorator<K extends HookEventKey> = <
    T extends HookEventListener<K>,
  >(
    target: object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>,
  ) => void;

  function OnEvent<K extends HookEventKey>(
    event: K,
    options?: OnEventOptions,
  ): OnEventMethodDecorator<K>;
  function OnEvent<K extends HookEventKey>(
    event: readonly K[],
    options?: OnEventOptions,
  ): OnEventMethodDecorator<K>;
  function OnEvent(
    event: OnEventType,
    options?: OnEventOptions,
  ): MethodDecorator;
}
