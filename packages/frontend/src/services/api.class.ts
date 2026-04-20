/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { AxiosInstance, AxiosResponse } from "axios";

import { AttachmentResourceRef } from "@/types/attachment.types";
import { ILoginAttributes } from "@/types/auth/login.types";
import { IUserPermissions } from "@/types/auth/permission.types";
import { THook } from "@/types/base.types";
import { ICsrf } from "@/types/csrf.types";
import { IMcpServerDiagnostics } from "@/types/mcp-server.types";
import { IResetPayload, IResetRequest } from "@/types/reset.types";
import { ISettingSchemasMap } from "@/types/setting.types";
import { StatsSummary } from "@/types/stat.types";
import { IProfileAttributes, IUser, IUserStub } from "@/types/user.types";
import { IWorkflow } from "@/types/workfow.types";
import { applyFullNameDerivedFields } from "@/utils/full-name.utils";

import { EntityType, Format, TCount, TypeByFormat } from "./types";

export type RouteParams = Record<
  string,
  string | number | boolean | null | undefined
>;

const resolveRoute = (route: string, params?: RouteParams) => {
  if (!params) {
    return route;
  }

  return route.replace(/:([A-Za-z0-9_]+)/g, (match, key) => {
    const value = params[key];

    if (value === undefined || value === null) {
      return match;
    }

    return encodeURIComponent(String(value));
  });
};

export const ROUTES = {
  // Misc
  CONFIRM_ACCOUNT: "/user/confirm",
  LOGIN: "/auth/local",
  ME: "/auth/me",
  LOGOUT: "/auth/logout",
  PROFILE: "/user/edit",
  USER_PERMISSIONS: "/user/permissions",
  CSRF: "/csrftoken",
  REFRESH_TRANSLATIONS: "/translation/refresh",
  RESET: "/user/reset",
  CONTENT_IMPORT: "/content/import",
  STATS_SUMMARY: "/stats/summary",
  WORKFLOW_PUBLISH: "/workflow/:id/publish",
  WORKFLOW_UNPUBLISH: "/workflow/:id/unpublish",
  WORKFLOW_BINDINGS: "/workflow/bindings",
  MCP_SERVER_TEST: "/mcpserver/:id/test",
  // Entities
  [EntityType.SUBSCRIBER]: "/subscriber",
  [EntityType.LABEL]: "/label",
  [EntityType.LABEL_GROUP]: "/labelgroup",
  [EntityType.ROLE]: "/role",
  [EntityType.USER]: "/user",
  [EntityType.PERMISSION]: "/permission",
  [EntityType.MODEL]: "/model",
  [EntityType.CREDENTIAL]: "/credential",
  [EntityType.MENU]: "/menu",
  [EntityType.MENUTREE]: "/menu/tree",
  [EntityType.CONTENT]: "/content",
  [EntityType.CONTENT_TYPE]: "/contenttype",
  [EntityType.SETTING]: "/setting",
  [EntityType.MESSAGE]: "/message",
  [EntityType.LANGUAGE]: "/language",
  [EntityType.TRANSLATION]: "/translation",
  [EntityType.ATTACHMENT]: "/attachment",
  [EntityType.CHANNEL]: "/channel",
  [EntityType.HELPER]: "/helper",
  [EntityType.NLU_HELPER]: "/helper/nlu",
  [EntityType.LLM_HELPER]: "/helper/llm",
  [EntityType.STORAGE_HELPER]: "/helper/storage",
  [EntityType.WORKFLOW]: "/workflow",
  [EntityType.WORKFLOW_VERSION]: "/workflow/:id/versions",
  [EntityType.WORKFLOW_ACTIONS]: "/workflow/actions/:type",
  [EntityType.WORKFLOW_RUN]: "/workflowrun",
  [EntityType.MCP_SERVER]: "/mcpserver",
  [EntityType.MCP_SERVER_TOOL]: "/mcpserver/:id/tools",
  [EntityType.MEMORY_DEFINITION]: "/memorydefinition",
  [EntityType.THREAD]: "/thread",
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

    return applyFullNameDerivedFields(data);
  }

  async logout() {
    const { data } = await this.request.post<{ status: "ok" }>(ROUTES.LOGOUT);

    return data;
  }

  async getCurrentSession() {
    const { data } = await this.request.get<IUser>(ROUTES.ME);

    return applyFullNameDerivedFields(data);
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

    return applyFullNameDerivedFields(data);
  }

  async confirmAccount(payload: { token: string }) {
    const { _csrf } = await this.getCsrf();
    const { data } = await this.request.post<
      never,
      AxiosResponse<never>,
      ICsrf
    >(`${ROUTES.CONFIRM_ACCOUNT}`, {
      ...payload,
      _csrf,
    });

    return data;
  }

  async getUserPermissions() {
    const { data } = await this.request.get<IUserPermissions>(
      ROUTES.USER_PERMISSIONS,
    );

    return data;
  }
  async requestResetPassword(payload: IResetRequest) {
    const { data } = await this.request.post<
      IResetRequest,
      AxiosResponse<void>,
      IResetRequest
    >(ROUTES.RESET, payload);

    return data;
  }

  async getStatsSummary() {
    const { data } = await this.request.get<StatsSummary>(ROUTES.STATS_SUMMARY);

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

  async resetPassword(token: string, payload: IResetPayload) {
    const { data } = await this.request.post<
      IResetPayload,
      AxiosResponse<void>,
      IResetPayload
    >(`${ROUTES.RESET}/${token}`, payload);

    return data;
  }

  async importContent(contentTypeId: string, attachmentId: string) {
    const { data } = await this.request.get(
      `${ROUTES.CONTENT_IMPORT}/${contentTypeId}/${attachmentId}`,
    );

    return data;
  }

  async getWorkflowBindings<T = Record<string, unknown>>() {
    const { data } = await this.request.get<T>(ROUTES.WORKFLOW_BINDINGS);

    return data;
  }

  async getSettingSchemas() {
    const { data } = await this.request.get<ISettingSchemasMap>(
      `${ROUTES[EntityType.SETTING]}/schemas`,
    );

    return data;
  }

  async testMcpServer(id: string) {
    const { _csrf } = await this.getCsrf();
    const route = resolveRoute(ROUTES.MCP_SERVER_TEST, { id });
    const { data } = await this.request.post<IMcpServerDiagnostics>(route, {
      _csrf,
    });

    return data;
  }

  async publishWorkflow(id: string) {
    const { _csrf } = await this.getCsrf();
    const route = resolveRoute(ROUTES.WORKFLOW_PUBLISH, { id });
    const { data } = await this.request.post<IWorkflow>(route, { _csrf });

    return data;
  }

  async unpublishWorkflow(id: string) {
    const { _csrf } = await this.getCsrf();
    const route = resolveRoute(ROUTES.WORKFLOW_UNPUBLISH, { id });
    const { data } = await this.request.post<IWorkflow>(route, { _csrf });

    return data;
  }

  async publishWorkflowVersion(workflowId: string, versionId: string) {
    const { _csrf } = await this.getCsrf();
    const route = resolveRoute(ROUTES[EntityType.WORKFLOW], {});
    const { data } = await this.request.patch<IWorkflow>(
      `${route}/${encodeURIComponent(workflowId)}`,
      {
        _csrf,
        publishedVersion: versionId,
      },
    );

    return data;
  }

  getRequest() {
    return this.request;
  }

  buildEntityClient<TE extends THook["entity"] = never>(
    entity: TE,
    routeParams?: RouteParams,
  ) {
    return EntityApiClient.getInstance(this.request, entity, routeParams);
  }
}

export class EntityApiClient<
  TE extends THook["entity"],
  TBasic = THook<{ entity: TE }>["basic"],
  TFull = THook<{ entity: TE }>["full"],
  TAttr = THook<{ entity: TE }>["attributes"],
  TFilters = THook<{ entity: TE }>["filters"],
> extends ApiClient {
  constructor(
    request: AxiosInstance,
    private readonly type: TE,
    private readonly routeParams?: RouteParams,
  ) {
    super(request);
  }

  static getInstance<TE extends THook["entity"]>(
    request: AxiosInstance,
    entity: TE,
    routeParams?: RouteParams,
  ) {
    return new EntityApiClient<TE>(request, entity, routeParams);
  }

  private getRoute(routeParams?: RouteParams) {
    return resolveRoute(ROUTES[this.type], routeParams ?? this.routeParams);
  }

  /**
   * Create an entry to the given entity type.
   */
  async create(payload: TAttr, routeParams?: RouteParams) {
    const { _csrf } = await this.getCsrf();
    const { data } = await this.request.post<
      TBasic,
      AxiosResponse<TBasic>,
      TAttr
    >(this.getRoute(routeParams), { ...payload, _csrf });

    return data;
  }

  async import<T = TBasic>(
    file: File,
    params?: any,
    routeParams?: RouteParams,
  ) {
    const { _csrf } = await this.getCsrf();
    const formData = new FormData();

    formData.append("file", file);

    const { data } = await this.request.post<T[], AxiosResponse<T[]>, FormData>(
      `${this.getRoute(routeParams)}/import`,
      formData,
      {
        params: { _csrf, ...params },
      },
    );

    return data;
  }

  async upload(
    file: File,
    resourceRef?: AttachmentResourceRef,
    routeParams?: RouteParams,
  ) {
    const { _csrf } = await this.getCsrf();
    const formData = new FormData();

    formData.append("file", file);

    const { data } = await this.request.post<
      TBasic[],
      AxiosResponse<TBasic[]>,
      FormData
    >(
      `${this.getRoute(routeParams)}/upload?_csrf=${_csrf}${
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
  >(id?: string, populate?: P, routeParams?: RouteParams) {
    const { data } = await this.request.get<T>(
      `${this.getRoute(routeParams)}${id ? `/${id}` : ""}`,
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
  >(params: any, populate: P, routeParams?: RouteParams) {
    const { data } = await this.request.get<T[]>(this.getRoute(routeParams), {
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
  async update(id: string, payload: Partial<TAttr>, routeParams?: RouteParams) {
    const { _csrf } = await this.getCsrf();
    const { data } = await this.request.patch<TBasic>(
      `${this.getRoute(routeParams)}/${id}`,
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
  async updateMany(
    ids: string[],
    payload: Partial<TAttr>,
    routeParams?: RouteParams,
  ) {
    const { _csrf } = await this.getCsrf();
    const { data } = await this.request.patch<string>(
      `${this.getRoute(routeParams)}/bulk`,
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
  async delete(id: string, routeParams?: RouteParams) {
    const { _csrf } = await this.getCsrf();
    const { data } = await this.request.delete<string>(
      `${this.getRoute(routeParams)}/${id}`,
      {
        data: { _csrf },
      },
    );

    return data;
  }

  /**
   * Bulk Delete entries.
   */
  async deleteMany(ids: string[], routeParams?: RouteParams) {
    const { _csrf } = await this.getCsrf();
    const { data } = await this.request.delete<string>(
      this.getRoute(routeParams),
      {
        data: {
          _csrf,
          ids,
        },
      },
    );

    return data;
  }

  /**
   * Count elements.
   */
  async count(params: { where?: TFilters }, routeParams?: RouteParams) {
    const { data } = await this.request.get<TCount>(
      `${this.getRoute(routeParams)}/count`,
      {
        params,
      },
    );

    return { count: data.count };
  }
}
