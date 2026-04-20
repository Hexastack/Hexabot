/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { UseMutationResult } from "@tanstack/react-query";
import { createContext, Dispatch, SetStateAction } from "react";

import { ILoginAttributes } from "@/types/auth/login.types";
import { IUser } from "@/types/user.types";

export interface AuthContextValue {
  user: IUser | undefined;
  isAuthenticated: boolean;
  refetchUser: () => Promise<IUser | undefined>;
  loginMutation: UseMutationResult<
    IUser,
    Error,
    [payload: ILoginAttributes],
    unknown
  >;
  logoutMutation: UseMutationResult<
    {
      status: "ok";
    },
    Error,
    [],
    unknown
  >;
  error: Error | null;
  setIsAuthenticated: Dispatch<SetStateAction<boolean>>;
}

export const AuthContext = createContext<AuthContextValue>({
  user: undefined,
  isAuthenticated: false,
  refetchUser: async () => undefined,
  loginMutation: {} as UseMutationResult<
    IUser,
    Error,
    [payload: ILoginAttributes],
    unknown
  >,
  logoutMutation: {} as UseMutationResult<
    {
      status: "ok";
    },
    Error,
    [],
    unknown
  >,
  error: null,
  setIsAuthenticated: () => {},
});
