/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { AxiosInstance, AxiosResponse } from "axios";

import { AttachmentResourceRef } from "@/types/attachment.types";
import { ILoginAttributes } from "@/types/auth/login.types";
import { IUserPermissions } from "@/types/auth/permission.types";
import { StatsType } from "@/types/bot-stat.types";
import { ICsrf } from "@/types/csrf.types";
import { IInvitation, IInvitationAttributes } from "@/types/invitation.types";
import { INlpDatasetSampleAttributes } from "@/types/nlp-sample.types";
import { IResetPayload, IResetRequest } from "@/types/reset.types";
import {
  IProfileAttributes,
  IUser,
  IUserAttributes,
  IUserStub,
} from "@/types/user.types";

import { EntityType, Format, TCount, TypeByFormat } from "./types";

export const ROUTES = {
  // Misc
  ACCEPT_INVITE: "/auth/accept-invite",
  CONFIRM_ACCOUNT: "/user/confirm",
  LOGIN: "/auth/local",
  ME: "/auth/me",
  LOGOUT: "/auth/logout",
  PROFILE: "/user/edit",
  INVITE: "/user/invite",
  USER_PERMISSIONS: "/user/permissions",
  CSRF: "/csrftoken",
  BOTSTATS: "/botstats",
  REFRESH_TRANSLATIONS: "/translation/refresh",
  FETCH_REMOTE_I18N: "/i18n",
  RESET: "/user/reset",
  NLP_SAMPLE_IMPORT: "/nlpsample/import",
  NLP_SAMPLE_ANNOTATE: "/nlpsample/annotate",
  NLP_SAMPLE_PREDICT: "/nlpsample/message",
  CONTENT_IMPORT: "/content/import",
  // Entities
  [EntityType.SUBSCRIBER]: "/subscriber",
  [EntityType.LABEL]: "/label",
  [EntityType.LABEL_GROUP]: "/labelgroup",
  [EntityType.ROLE]: "/role",
  [EntityType.USER]: "/user",
  [EntityType.PERMISSION]: "/permission",
  [EntityType.MODEL]: "/model",
  [EntityType.CATEGORY]: "/category",
  [EntityType.CONTEXT_VAR]: "/contextVar",
  [EntityType.MENU]: "/menu",
  [EntityType.MENUTREE]: "/menu/tree",
  [EntityType.CONTENT]: "/content",
  [EntityType.CONTENT_TYPE]: "/contenttype",
  [EntityType.SETTING]: "/setting",
  [EntityType.BOTSTATS]: "/botstats",
  [EntityType.BLOCK]: "/block",
  [EntityType.BLOCK_SEARCH]: "/block/search",
  [EntityType.CUSTOM_BLOCK]: "/block/customBlocks",
  [EntityType.CUSTOM_BLOCK_SETTINGS]: "/block/customBlocks/settings",
  [EntityType.NLP_SAMPLE]: "/nlpsample",
  [EntityType.NLP_ENTITY]: "/nlpentity",
  [EntityType.NLP_VALUE]: "/nlpvalue",
  [EntityType.NLP_SAMPLE_ENTITY]: "",
  [EntityType.MESSAGE]: "/message",
  [EntityType.LANGUAGE]: "/language",
  [EntityType.TRANSLATION]: "/translation",
  [EntityType.ATTACHMENT]: "/attachment",
  [EntityType.CHANNEL]: "/channel",
  [EntityType.HELPER]: "/helper",
  [EntityType.NLU_HELPER]: "/helper/nlu",
  [EntityType.LLM_HELPER]: "/helper/llm",
  [EntityType.FLOW_ESCAPE_HELPER]: "helper/flow_escape",
  [EntityType.STORAGE_HELPER]: "/helper/storage",
} as const;

export class ApiClient {
  constructor(protected readonly request: AxiosInstance) {}

  async getCsrf() {
    const { data } = await this.request.get<ICsrf>(ROUTES.CSRF, {
      withCredentials: true,
    });

    return data;
  }

  async login(payload: ILoginAttributes) {
    const { data } = await this.request.post<
      IUser,
      AxiosResponse<IUser>,
      ILoginAttributes
    >(ROUTES.LOGIN, payload);

    return data;
  }

  async logout() {
    const { data } = await this.request.post<{ status: "ok" }>(ROUTES.LOGOUT);

    return data;
  }

  async getCurrentSession() {
    const { data } = await this.request.get<IUser>(ROUTES.ME);

    return data;
  }

  async updateProfile(id: string, payload: Partial<IProfileAttributes>) {
    const { _csrf } = await this.getCsrf();
    const formData = new FormData();

    for (const [key, value] of Object.entries(payload)) {
      if (value !== undefined) {
        formData.append(key, value as string | Blob);
      }
    }

    // Append the CSRF token
    formData.append("_csrf", _csrf);

    const { data } = await this.request.patch<
      IUserStub,
      AxiosResponse<IUserStub>,
      Partial<IProfileAttributes>
    >(`${ROUTES.PROFILE}/${id}?_csrf=${_csrf}`, payload, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return data;
  }

  async invite(payload: IInvitationAttributes) {
    const { _csrf } = await this.getCsrf();
    const { data } = await this.request.post<
      IInvitation,
      AxiosResponse<IInvitation>,
      IInvitationAttributes & ICsrf
    >(ROUTES.INVITE, {
      ...payload,
      _csrf,
    });

    return data;
  }

  async acceptInvite({
    token,
    ...rest
  }: Partial<IUserAttributes> & { token: string }) {
    const { _csrf } = await this.getCsrf();
    const { data } = await this.request.post<
      IInvitation,
      AxiosResponse<{
        success: boolean;
      }>,
      ICsrf
    >(`${ROUTES.ACCEPT_INVITE}/${token}`, {
      ...rest,
      _csrf,
    });

    return data;
  }

  async confirmAccount(payload: { token: string }) {
    const { _csrf } = await this.getCsrf();
    const { data } = await this.request.post<
      IInvitation,
      AxiosResponse<never>,
      ICsrf
    >(`${ROUTES.CONFIRM_ACCOUNT}`, {
      ...payload,
      _csrf,
    });

    return data;
  }

  async getUserPermissions(id: string) {
    const { data } = await this.request.get<IUserPermissions>(
      `${ROUTES.USER_PERMISSIONS}/${id}`,
    );

    return data;
  }
  async requestReset(payload: IResetRequest) {
    const { data } = await this.request.post<
      IResetRequest,
      AxiosResponse<void>,
      IResetRequest
    >(ROUTES.RESET, payload);

    return data;
  }

  async getBotStats<T>(type: StatsType) {
    const { data } = await this.request.get<T[]>(`${ROUTES.BOTSTATS}/${type}`);

    return data;
  }

  async refreshTranslations() {
    const { _csrf } = await this.getCsrf();
    const { data } = await this.request.post<{
      acknowledged: boolean;
      deletedCount: number;
    }>(ROUTES.REFRESH_TRANSLATIONS, { _csrf });

    return data;
  }

  async fetchRemoteI18n() {
    const { data } = await this.request.get(ROUTES.FETCH_REMOTE_I18N);

    return data;
  }

  async reset(token: string, payload: IResetPayload) {
    const { data } = await this.request.post<
      IResetPayload,
      AxiosResponse<void>,
      IResetPayload
    >(`${ROUTES.RESET}/${token}`, payload);

    return data;
  }

  async importNlpSamples(attachmentId: string) {
    const { _csrf } = await this.getCsrf();
    const { data } = await this.request.post(
      `${ROUTES.NLP_SAMPLE_IMPORT}/${attachmentId}`,
      { _csrf },
    );

    return data;
  }

  async annotateNlpSamples(entityId: string) {
    const { _csrf } = await this.getCsrf();
    const { data } = await this.request.post(
      `${ROUTES.NLP_SAMPLE_ANNOTATE}/${entityId}`,
      { _csrf },
    );

    return data;
  }

  async importContent(contentTypeId: string, attachmentId: string) {
    const { data } = await this.request.get(
      `${ROUTES.CONTENT_IMPORT}/${contentTypeId}/${attachmentId}`,
    );

    return data;
  }

  async predictNlp(text: string) {
    const { data } = await this.request.get<INlpDatasetSampleAttributes>(
      `${ROUTES.NLP_SAMPLE_PREDICT}`,
      { params: { text } },
    );

    return data;
  }

  getRequest() {
    return this.request;
  }

  buildEntityClient<TAttr, TStub, TFull = never>(type: EntityType) {
    return EntityApiClient.getInstance<TAttr, TStub, TFull>(this.request, type);
  }
}

export class EntityApiClient<TAttr, TBasic, TFull> extends ApiClient {
  constructor(request: AxiosInstance, private readonly type: EntityType) {
    super(request);
  }

  static getInstance<TA, TS, TF>(request: AxiosInstance, type: EntityType) {
    return new EntityApiClient<TA, TS, TF>(request, type);
  }

  /**
   * Create an entry to the given entity type.
   */
  async create(payload: TAttr) {
    const { _csrf } = await this.getCsrf();
    const { data } = await this.request.post<
      TBasic,
      AxiosResponse<TBasic>,
      TAttr
    >(ROUTES[this.type], { ...payload, _csrf });

    return data;
  }

  async import<T = TBasic>(file: File, params?: any) {
    const { _csrf } = await this.getCsrf();
    const formData = new FormData();

    formData.append("file", file);

    const { data } = await this.request.post<T[], AxiosResponse<T[]>, FormData>(
      `${ROUTES[this.type]}/import`,
      formData,
      {
        params: { _csrf, ...params },
      },
    );

    return data;
  }

  async upload(file: File, resourceRef?: AttachmentResourceRef) {
    const { _csrf } = await this.getCsrf();
    const formData = new FormData();

    formData.append("file", file);

    const { data } = await this.request.post<
      TBasic[],
      AxiosResponse<TBasic[]>,
      FormData
    >(
      `${ROUTES[this.type]}/upload?_csrf=${_csrf}${
        resourceRef ? `&resourceRef=${resourceRef}` : ""
      }`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return data[0];
  }

  private serializePopulate<P = string[] | undefined>(populate: P) {
    return ((populate || []) as string[]).join(",");
  }

  async get<
    P = string[] | undefined,
    F extends Format = P extends undefined ? Format.BASIC : Format.FULL,
    T = TypeByFormat<F, TBasic, TFull>,
  >(id?: string, populate?: P) {
    const { data } = await this.request.get<T>(
      `${ROUTES[this.type]}${id ? `/${id}` : ""}`,
      {
        params: {
          ...(Array.isArray(populate) &&
            populate.length && { populate: this.serializePopulate(populate) }),
        },
      },
    );

    return data;
  }

  async find<
    P = string[] | undefined,
    F extends Format = P extends undefined ? Format.BASIC : Format.FULL,
    T = TypeByFormat<F, TBasic, TFull>,
  >(params: any, populate: P) {
    const { data } = await this.request.get<T[]>(ROUTES[this.type], {
      params: {
        ...params,
        ...(Array.isArray(populate) &&
          populate.length && { populate: this.serializePopulate(populate) }),
      },
    });

    return data;
  }

  /**
   * Update an entry in a entity type.
   */
  async update(id: string, payload: Partial<TAttr>) {
    const { _csrf } = await this.getCsrf();
    const { data } = await this.request.patch<TBasic>(
      `${ROUTES[this.type]}/${id}`,
      {
        ...payload,
        _csrf,
      },
    );

    return data;
  }

  /**
   * Bulk Update entries.
   */
  async updateMany(ids: string[], payload: Partial<TAttr>) {
    const { _csrf } = await this.getCsrf();
    const { data } = await this.request.patch<string>(
      `${ROUTES[this.type]}/bulk`,
      {
        _csrf,
        ids,
        payload,
      },
    );

    return data;
  }

  /**
   * Delete an entry.
   */
  async delete(id: string) {
    const { _csrf } = await this.getCsrf();
    const { data } = await this.request.delete<string>(
      `${ROUTES[this.type]}/${id}`,
      {
        data: { _csrf },
      },
    );

    return data;
  }

  /**
   * Bulk Delete entries.
   */
  async deleteMany(ids: string[]) {
    const { _csrf } = await this.getCsrf();
    const { data } = await this.request.delete<string>(`${ROUTES[this.type]}`, {
      data: {
        _csrf,
        ids,
      },
    });

    return data;
  }

  /**
   * Count elements.
   */
  async count(params?: any) {
    const { data } = await this.request.get<TCount>(
      `${ROUTES[this.type]}/count`,
      {
        params,
      },
    );

    return { count: data.count };
  }
}
