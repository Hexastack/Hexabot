declare module "*.css";

import { EntityType, Format } from "@/services/types";
import { IRole } from "./src/types/role.types";
import { IPermission } from "./src/types/permission.types";

export interface IUserPermissions {
  roles: IRole[];
  permissions: Array<{
    action: PermissionAction;
    model: EntityType;
    relation: string;
  }>;
}

export type TJwtPayload = {
  email: string;
  roles: [];
  iat: number;
  exp: number;
};

export interface IResetRequest {
  email: string;
}

export interface IResetPayload {
  password: string;
}

export interface IInvitationAttributes {
  email: string;
  roles: string[];
}

export type TRelation = "role" | "owner";

export interface IUserAttributes {
  first_name: string;
  last_name: string;
  email: string;
  language: string;
  password?: string;
  state: boolean;
  roles: string[];
  avatar: string | null;
}

export interface IRoleAttributes {
  name: string;
}

export interface IModelAttributes {
  name: string;
  identity: string;
  attributes: object;
  relation: TRelation;
}
