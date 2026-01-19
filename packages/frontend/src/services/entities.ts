/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { schema } from "normalizr";

import { IBaseSchema } from "@/types/base.types";
import { ISubscriberStub } from "@/types/subscriber.types";

import { EntityType } from "./types";

const processCommonStrategy = <T extends IBaseSchema>(entity: T) => ({
  ...entity,
  ...(entity.createdAt && { createdAt: new Date(entity.createdAt) }),
  ...(entity.updatedAt && { updatedAt: new Date(entity.updatedAt) }),
});

export const WorkflowEntity = new schema.Entity(
  EntityType.WORKFLOW,
  undefined,
  {
    idAttribute: ({ id }) => id,
    processStrategy: processCommonStrategy,
  },
);

export const WorkflowActionEntity = new schema.Entity(
  EntityType.WORKFLOW_ACTIONS,
  undefined,
  {
    idAttribute: ({ name }) => name,
    processStrategy: (entity) => {
      return {
        ...entity,
        parseSettings: (payload) => payload,
      };
    },
  },
);

export const MemoryDefinitionEntity = new schema.Entity(
  EntityType.MEMORY_DEFINITION,
  undefined,
  {
    idAttribute: ({ id }) => id,
    processStrategy: processCommonStrategy,
  },
);

export const RoleEntity = new schema.Entity(EntityType.ROLE, undefined, {
  idAttribute: ({ id }) => id,
  processStrategy: processCommonStrategy,
});

export const AttachmentEntity = new schema.Entity(
  EntityType.ATTACHMENT,
  undefined,
  {
    idAttribute: ({ id }) => id,
    processStrategy: processCommonStrategy,
  },
);

export const UserEntity = new schema.Entity(
  EntityType.USER,
  {
    roles: [RoleEntity],
    avatar: AttachmentEntity,
  },
  {
    idAttribute: ({ id }) => id,
    processStrategy: processCommonStrategy,
  },
);

export const WorkflowRunEntity = new schema.Entity(
  EntityType.WORKFLOW_RUN,
  {
    workflow: WorkflowEntity,
    triggeredBy: UserEntity,
  },
  {
    idAttribute: ({ id }) => id,
    processStrategy: (entity) => {
      const processed = processCommonStrategy(entity);
      // Convert date fields

      if (entity.suspendedAt) {
        processed.suspendedAt = new Date(entity.suspendedAt);
      }
      if (entity.finishedAt) {
        processed.finishedAt = new Date(entity.finishedAt);
      }
      if (entity.failedAt) {
        processed.failedAt = new Date(entity.failedAt);
      }
      
return processed;
    },
  },
);

export const SubscriberEntity = new schema.Entity(
  EntityType.SUBSCRIBER,
  {
    assignedTo: UserEntity,
  },
  {
    idAttribute: ({ id }) => id,
    processStrategy: <T extends ISubscriberStub>(entity: T) => {
      if (entity.assignedAt) {
        entity.assignedAt = new Date(entity.assignedAt);
      }

      if (entity.lastvisit) {
        entity.lastvisit = new Date(entity.lastvisit);
      }

      if (entity.retainedFrom) {
        entity.retainedFrom = new Date(entity.retainedFrom);
      }

      return processCommonStrategy(entity);
    },
  },
);

export const LabelGroupEntity = new schema.Entity(
  EntityType.LABEL_GROUP,
  {},
  {
    idAttribute: ({ id }) => id,
    processStrategy: processCommonStrategy,
  },
);

export const LabelEntity = new schema.Entity(
  EntityType.LABEL,
  {
    users: [SubscriberEntity],
    group: LabelGroupEntity,
  },
  {
    idAttribute: ({ id }) => id,
    processStrategy: processCommonStrategy,
  },
);
SubscriberEntity.define({
  labels: [LabelEntity],
});

export const MessageEntity = new schema.Entity(
  EntityType.MESSAGE,
  {
    sender: SubscriberEntity,
    recipient: SubscriberEntity,
    sentBy: UserEntity,
  },
  {
    idAttribute: ({ id }) => id,
    processStrategy: processCommonStrategy,
  },
);

export const PermissionEntity = new schema.Entity(
  EntityType.PERMISSION,
  undefined,
  {
    idAttribute: ({ id }) => id,
    processStrategy: processCommonStrategy,
  },
);

export const ModelEntity = new schema.Entity(
  EntityType.MODEL,
  { permissions: [PermissionEntity] },
  {
    idAttribute: ({ id }) => id,
  },
);

export const MenuLeafEntity = new schema.Entity(EntityType.MENU, undefined, {
  idAttribute: ({ id }) => id,
  processStrategy: processCommonStrategy,
});

export const MenuItemEntity = new schema.Entity(
  EntityType.MENU,
  {
    parent: MenuLeafEntity,
    call_to_actions: [MenuLeafEntity],
  },
  {
    idAttribute: ({ id }) => id,
    processStrategy: processCommonStrategy,
  },
);

export const MenuNodeEntity = new schema.Entity(EntityType.MENU, undefined, {
  idAttribute: ({ id }) => id,
  processStrategy: processCommonStrategy,
});

MenuNodeEntity.define({
  call_to_actions: [MenuNodeEntity],
});

export const ContentTypeEntity = new schema.Entity(
  EntityType.CONTENT_TYPE,
  undefined,
  {
    idAttribute: ({ id }) => id,
  },
);

export const ContentEntity = new schema.Entity(
  EntityType.CONTENT,
  { contentType: ContentTypeEntity },
  {
    idAttribute: ({ id }) => id,
    processStrategy: processCommonStrategy,
  },
);

export const SettingEntity = new schema.Entity(EntityType.SETTING, undefined, {
  idAttribute: ({ id }) => id,
  processStrategy: processCommonStrategy,
});

export const LanguageEntity = new schema.Entity(
  EntityType.LANGUAGE,
  undefined,
  {
    idAttribute: ({ id }) => id,
    processStrategy: processCommonStrategy,
  },
);

export const TranslationEntity = new schema.Entity(
  EntityType.TRANSLATION,
  undefined,
  {
    idAttribute: ({ id }) => id,
    processStrategy: processCommonStrategy,
  },
);

export const NlpValueEntity = new schema.Entity(
  EntityType.NLP_VALUE,
  undefined,
  {
    idAttribute: ({ id }) => id,
    processStrategy: processCommonStrategy,
  },
);

export const NlpEntityEntity = new schema.Entity(
  EntityType.NLP_ENTITY,
  { values: [NlpValueEntity] },
  {
    idAttribute: ({ id }) => id,
    processStrategy: processCommonStrategy,
  },
);

NlpValueEntity.define({
  entity: NlpEntityEntity,
});

export const NlpSampleEntityEntity = new schema.Entity(
  EntityType.NLP_SAMPLE_ENTITY,
  {
    entity: NlpEntityEntity,
    value: NlpValueEntity,
  },
  {
    idAttribute: ({ id }) => id,
    processStrategy: processCommonStrategy,
  },
);

export const NlpSampleEntity = new schema.Entity(
  EntityType.NLP_SAMPLE,
  {
    entities: [NlpSampleEntityEntity],
    language: LanguageEntity,
  },
  {
    idAttribute: ({ id }) => id,
    processStrategy: processCommonStrategy,
  },
);

export const ChannelEntity = new schema.Entity(EntityType.CHANNEL, undefined, {
  idAttribute: ({ name }) => name,
});

export const HelperEntity = new schema.Entity(EntityType.HELPER, undefined, {
  idAttribute: ({ name }) => name,
});

export const NluHelperEntity = new schema.Entity(
  EntityType.NLU_HELPER,
  undefined,
  {
    idAttribute: ({ name }) => name,
  },
);

export const LlmHelperEntity = new schema.Entity(
  EntityType.LLM_HELPER,
  undefined,
  {
    idAttribute: ({ name }) => name,
  },
);

export const FlowEscapeHelperEntity = new schema.Entity(
  EntityType.FLOW_ESCAPE_HELPER,
  undefined,
  {
    idAttribute: ({ name }) => name,
  },
);

export const StorageHelperEntity = new schema.Entity(
  EntityType.STORAGE_HELPER,
  undefined,
  {
    idAttribute: ({ name }) => name,
  },
);

export const ENTITY_MAP = {
  [EntityType.WORKFLOW]: WorkflowEntity,
  [EntityType.WORKFLOW_ACTIONS]: WorkflowActionEntity,
  [EntityType.WORKFLOW_RUN]: WorkflowRunEntity,
  [EntityType.MEMORY_DEFINITION]: MemoryDefinitionEntity,
  [EntityType.SUBSCRIBER]: SubscriberEntity,
  [EntityType.LABEL]: LabelEntity,
  [EntityType.LABEL_GROUP]: LabelGroupEntity,
  [EntityType.ROLE]: RoleEntity,
  [EntityType.USER]: UserEntity,
  [EntityType.PERMISSION]: PermissionEntity,
  [EntityType.MODEL]: ModelEntity,
  [EntityType.MENU]: MenuItemEntity,
  [EntityType.MESSAGE]: MessageEntity,
  [EntityType.MENUTREE]: MenuNodeEntity,
  [EntityType.CONTENT]: ContentEntity,
  [EntityType.CONTENT_TYPE]: ContentTypeEntity,
  [EntityType.SETTING]: SettingEntity,
  [EntityType.NLP_SAMPLE]: NlpSampleEntity,
  [EntityType.NLP_ENTITY]: NlpEntityEntity,
  [EntityType.NLP_SAMPLE_ENTITY]: NlpSampleEntityEntity,
  [EntityType.NLP_VALUE]: NlpValueEntity,
  [EntityType.LANGUAGE]: LanguageEntity,
  [EntityType.TRANSLATION]: TranslationEntity,
  [EntityType.ATTACHMENT]: AttachmentEntity,
  [EntityType.CHANNEL]: ChannelEntity,
  [EntityType.HELPER]: HelperEntity,
  [EntityType.NLU_HELPER]: NluHelperEntity,
  [EntityType.LLM_HELPER]: LlmHelperEntity,
  [EntityType.FLOW_ESCAPE_HELPER]: FlowEscapeHelperEntity,
  [EntityType.STORAGE_HELPER]: StorageHelperEntity,
} as const;
