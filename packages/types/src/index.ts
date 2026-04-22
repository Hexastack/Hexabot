/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

export {
  AttachmentAccess,
  AttachmentCreatedByRef,
  AttachmentResourceRef,
  attachmentFullSchema,
  attachmentOwnerStubSchema,
  attachmentSchema,
  attachmentStubSchema,
} from "./attachment";

export type {
  Attachment,
  AttachmentFull,
  AttachmentOwnerStub,
  AttachmentStub,
} from "./attachment";

export {
  asId,
  asIdArray,
  baseStubSchema,
  labelSchema as fragmentLabelSchema,
  paginationLikeSchema,
  plainReferenceSchema,
  preprocess,
  roleSchema as fragmentRoleSchema,
  subscriberChannelSchema,
  subscriberSchema as fragmentSubscriberSchema,
  userProfileAssignedSchema,
  userProfileStubSchema as fragmentUserProfileStubSchema,
  userProviderSchema,
  withAliases,
} from "./fragments";

export type { UserProfileAssigned, UserProvider } from "./fragments";

export { userFullSchema, userSchema, userStubSchema } from "./user";

export type { User, UserFull, UserStub } from "./user";

export {
  Action,
  DirectionType,
  McpServerTransport,
  MemoryScope,
  MenuType,
  MethodToAction,
  StatsType,
  WorkflowType,
  WorkflowVersionAction,
  directionTypeSchema,
  mcpServerTransportSchema,
  memoryScopeSchema,
  menuTypeSchema,
  modelIdentitySchema,
  relationSchema,
  statsTypeSchema,
  workflowTypeSchema,
  workflowVersionActionSchema,
} from "./primitives";

export type {
  ModelPermissionsPerRole,
  PermissionsTree,
  TModel,
  TRelation,
} from "./primitives";

export {
  credentialFullSchema,
  credentialSchema,
  credentialStubSchema,
  modelFullSchema,
  modelSchema,
  modelStubSchema,
  permissionFullSchema,
  permissionSchema,
  permissionStubSchema,
  roleFullSchema,
  roleSchema,
  roleStubSchema,
  userProfileFullSchema,
  userProfileSchema,
  userProfileStubSchema,
} from "./user-access";

export type {
  Credential,
  CredentialFull,
  CredentialStub,
  Model,
  ModelFull,
  ModelStub,
  Permission,
  PermissionFull,
  PermissionStub,
  Role,
  RoleFull,
  RoleStub,
  UserProfile,
  UserProfileFull,
  UserProfileStub,
} from "./user-access";

export {
  labelFullSchema,
  labelGroupFullSchema,
  labelGroupSchema,
  labelGroupStubSchema,
  labelSchema,
  labelStubSchema,
  messageFullSchema,
  messageSchema,
  messageStubSchema,
  subscriberFullSchema,
  subscriberSchema,
  subscriberStubSchema,
  threadFullSchema,
  threadSchema,
  threadStubSchema,
} from "./chat";

export type {
  Label,
  LabelFull,
  LabelGroup,
  LabelGroupFull,
  LabelGroupStub,
  LabelStub,
  Message,
  MessageFull,
  MessageStub,
  Subscriber,
  SubscriberFull,
  SubscriberStub,
  Thread,
  ThreadFull,
  ThreadStub,
} from "./chat";

export {
  contentFullSchema,
  contentSchema,
  contentStubSchema,
  contentTypeFullSchema,
  contentTypeSchema,
  contentTypeStubSchema,
  menuFullSchema,
  menuSchema,
  menuStubSchema,
} from "./cms";

export type {
  Content,
  ContentFull,
  ContentStub,
  ContentType,
  ContentTypeFull,
  ContentTypeStub,
  Menu,
  MenuFull,
  MenuStub,
} from "./cms";

export {
  languageFullSchema,
  languageSchema,
  languageStubSchema,
  translationFullSchema,
  translationSchema,
  translationStubSchema,
} from "./i18n";

export type {
  Language,
  LanguageFull,
  LanguageStub,
  Translation,
  TranslationFull,
  TranslationStub,
} from "./i18n";

export {
  FieldType,
  metadataFullSchema,
  metadataSchema,
  metadataStubSchema,
  settingFullSchema,
  settingSchema,
  settingStubSchema,
  settingValueSchema,
} from "./setting";

export type {
  Metadata,
  MetadataFull,
  MetadataStub,
  Setting,
  SettingFull,
  SettingStub,
} from "./setting";

export { statsFullSchema, statsSchema, statsStubSchema } from "./analytics";

export type { Stats, StatsFull, StatsStub } from "./analytics";

export {
  createWorkflowFullSchema,
  mcpServerFullSchema,
  mcpServerSchema,
  mcpServerStubSchema,
  memoryDefinitionFullSchema,
  memoryDefinitionSchema,
  memoryDefinitionStubSchema,
  memoryRecordFullSchema,
  memoryRecordSchema,
  memoryRecordStubSchema,
  resolveRunDurationMs,
  workflowFullSchema,
  workflowRunFullSchema,
  workflowRunSchema,
  workflowRunStubSchema,
  workflowSchema,
  workflowStubSchema,
  workflowVersionFullSchema,
  workflowVersionSchema,
  workflowVersionStubSchema,
} from "./workflow";

export type {
  McpServer,
  McpServerFull,
  McpServerStub,
  MemoryDefinition,
  MemoryDefinitionFull,
  MemoryDefinitionStub,
  MemoryRecord,
  MemoryRecordFull,
  MemoryRecordStub,
  Workflow,
  WorkflowDefinitionParser,
  WorkflowFull,
  WorkflowRun,
  WorkflowRunFull,
  WorkflowRunStub,
  WorkflowStub,
  WorkflowVersion,
  WorkflowVersionFull,
  WorkflowVersionStub,
} from "./workflow";

export { dummyFullSchema, dummySchema, dummyStubSchema } from "./dummy";

export type { Dummy, DummyFull, DummyStub } from "./dummy";
