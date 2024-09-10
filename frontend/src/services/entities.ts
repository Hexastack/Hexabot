/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
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

export const LabelEntity = new schema.Entity(
  EntityType.LABEL,
  {
    users: [SubscriberEntity],
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

export const CategoryEntity = new schema.Entity(
  EntityType.CATEGORY,
  undefined,
  {
    idAttribute: ({ id }) => id,
  },
);

export const ContextVarsEntity = new schema.Entity(
  EntityType.CONTEXT_VAR,
  undefined,
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

export const ContentEntity = new schema.Entity(EntityType.CONTENT, undefined, {
  idAttribute: ({ id }) => id,
  processStrategy: processCommonStrategy,
});

export const SettingEntity = new schema.Entity(EntityType.SETTING, {
  idAttribute: ({ id }) => id,
  processStrategy: processCommonStrategy,
});

export const NlpSampleEntity = new schema.Entity(
  EntityType.NLP_SAMPLE,
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

export const NlpSampleEntityEntity = new schema.Entity(
  EntityType.NLP_SAMPLE_ENTITY,
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

//TODO need to be updated
export const BlockEntity = new schema.Entity(
  EntityType.BLOCK,
  {
    trigger_labels: [LabelEntity],
    assign_labels: [LabelEntity],
    assignTo: [UserEntity],
    category: CategoryEntity,
  },
  {
    idAttribute: ({ id }) => id,
    processStrategy: processCommonStrategy,
  },
);

BlockEntity.define({
  nextBlocks: [BlockEntity],
  previousBlocks: [BlockEntity],
  attachedBlock: BlockEntity,
  attachedToBlock: BlockEntity,
});

export const CustomBlockEntity = new schema.Entity(
  EntityType.CUSTOM_BLOCK,
  undefined,
  {
    idAttribute: ({ name }) => name,
  },
);

export const CustomBlockSettingEntity = new schema.Entity(
  EntityType.CUSTOM_BLOCK_SETTINGS,
  undefined,
  {
    idAttribute: ({ id }) => id,
  },
);

export const ChannelEntity = new schema.Entity(EntityType.CHANNEL, undefined, {
  idAttribute: ({ name }) => name,
});

export const ENTITY_MAP = {
  [EntityType.SUBSCRIBER]: SubscriberEntity,
  [EntityType.LABEL]: LabelEntity,
  [EntityType.ROLE]: RoleEntity,
  [EntityType.USER]: UserEntity,
  [EntityType.PERMISSION]: PermissionEntity,
  [EntityType.MODEL]: ModelEntity,
  [EntityType.CATEGORY]: CategoryEntity,
  [EntityType.CONTEXT_VAR]: ContextVarsEntity,
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
  [EntityType.TRANSLATION]: TranslationEntity,
  [EntityType.ATTACHMENT]: AttachmentEntity,
  [EntityType.BLOCK]: BlockEntity,
  [EntityType.CUSTOM_BLOCK]: CustomBlockEntity,
  [EntityType.CUSTOM_BLOCK_SETTINGS]: CustomBlockSettingEntity,
  [EntityType.CHANNEL]: ChannelEntity,
} as const;
