/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import mongoose from 'mongoose';
import leanDefaults from 'mongoose-lean-defaults';
import leanGetters from 'mongoose-lean-getters';
import leanVirtuals from 'mongoose-lean-virtuals';

import botStatsSchema, { BotStats } from '@/analytics/schemas/bot-stats.schema';
import attachmentSchema, {
  Attachment,
} from '@/attachment/schemas/attachment.schema';
import blockSchema, { Block } from '@/chat/schemas/block.schema';
import contextVarSchema, {
  ContextVar,
} from '@/chat/schemas/context-var.schema';
import conversationSchema, {
  Conversation,
} from '@/chat/schemas/conversation.schema';
import labelSchema, { Label } from '@/chat/schemas/label.schema';
import messageSchema, { Message } from '@/chat/schemas/message.schema';
import subscriberSchema, { Subscriber } from '@/chat/schemas/subscriber.schema';
import { ContentType } from '@/cms/schemas/content-type.schema';
import contentSchema, { Content } from '@/cms/schemas/content.schema';
import menuSchema, { Menu } from '@/cms/schemas/menu.schema';
import { config } from '@/config';
import translationSchema, {
  Translation,
} from '@/i18n/schemas/translation.schema';
import nlpEntitySchema, { NlpEntity } from '@/nlp/schemas/nlp-entity.schema';
import nlpSampleEntitySchema, {
  NlpSampleEntity,
} from '@/nlp/schemas/nlp-sample-entity.schema';
import nlpSampleSchema, { NlpSample } from '@/nlp/schemas/nlp-sample.schema';
import nlpValueSchema, { NlpValue } from '@/nlp/schemas/nlp-value.schema';
import settingSchema, { Setting } from '@/setting/schemas/setting.schema';
import invitationSchema, { Invitation } from '@/user/schemas/invitation.schema';
import modelSchema, { Model } from '@/user/schemas/model.schema';
import permissionSchema, { Permission } from '@/user/schemas/permission.schema';
import roleSchema, { Role } from '@/user/schemas/role.schema';
import userSchema, { User } from '@/user/schemas/user.schema';
import idPlugin from '@/utils/schema-plugin/id.plugin';

async function mongoMigrationConnection() {
  try {
    const connection = await mongoose.connect(config.mongo.uri, {
      dbName: config.mongo.dbName,
    });

    connection.plugin(idPlugin);
    connection.plugin(leanVirtuals);
    connection.plugin(leanGetters);
    connection.plugin(leanDefaults);
  } catch (err) {
    throw err;
  }
}

async function getModels() {
  await mongoMigrationConnection();
  const AttachementModel = mongoose.model<Attachment>(
    Attachment.name,
    attachmentSchema,
  );
  const BlockModel = mongoose.model<Block>(Block.name, blockSchema);
  const BotstatsModel = mongoose.model<BotStats>(BotStats.name, botStatsSchema);
  const ContentModel = mongoose.model<Content>(Content.name, contentSchema);
  const ContenttypeModel = mongoose.model<ContentType>(
    ContentType.name,
    contentSchema,
  );
  const ContextVarModel = mongoose.model<ContextVar>(
    ContextVar.name,
    contextVarSchema,
  );
  const ConversationModel = mongoose.model<Conversation>(
    Conversation.name,
    conversationSchema,
  );
  const InvitationModel = mongoose.model<Invitation>(
    Invitation.name,
    invitationSchema,
  );
  const LabelModel = mongoose.model<Label>(Label.name, labelSchema);
  const MenuModel = mongoose.model<Menu>(Menu.name, menuSchema);
  const MessageModel = mongoose.model<Message>(Message.name, messageSchema);
  const ModelModel = mongoose.model<Model>(Model.name, modelSchema);
  const NlpEntityModel = mongoose.model<NlpEntity>(
    NlpEntity.name,
    nlpEntitySchema,
  );
  const NlpSampleEntityModel = mongoose.model<NlpSampleEntity>(
    NlpSampleEntity.name,
    nlpSampleEntitySchema,
  );
  const NlpSampleModel = mongoose.model<NlpSample>(
    NlpSample.name,
    nlpSampleSchema,
  );
  const NlpValueModel = mongoose.model<NlpValue>(NlpValue.name, nlpValueSchema);
  const PermissionModel = mongoose.model<Permission>(
    Permission.name,
    permissionSchema,
  );
  const RoleModel = mongoose.model<Role>(Role.name, roleSchema);
  const SettingModel = mongoose.model<Setting>(Setting.name, settingSchema);
  const SubscriberModel = mongoose.model(Subscriber.name, subscriberSchema);
  const TranslationModel = mongoose.model<Translation>(
    Translation.name,
    translationSchema,
  );
  const UserModel = mongoose.model<User>(User.name, userSchema);

  return {
    AttachementModel,
    BlockModel,
    BotstatsModel,
    ContentModel,
    ContenttypeModel,
    ContextVarModel,
    ConversationModel,
    InvitationModel,
    LabelModel,
    MenuModel,
    MessageModel,
    ModelModel,
    NlpEntityModel,
    NlpSampleEntityModel,
    NlpSampleModel,
    NlpValueModel,
    PermissionModel,
    RoleModel,
    SettingModel,
    SubscriberModel,
    TranslationModel,
    UserModel,
  };
}

export default getModels;
