/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { createContext } from "react";

import { UseMutateFunction } from "@/types/tanstack.types";
import { IUser } from "@/types/user.types";

export interface AuthContextValue {
  user: IUser | undefined;
  isAuthenticated: boolean;
  authenticate: (user: IUser) => void;
  refetchUser: () => Promise<IUser | undefined>;
  logout: UseMutateFunction;
  error: Error | null;
}

export const AuthContext = createContext<AuthContextValue>({
  user: undefined,
  isAuthenticated: false,
  authenticate: () => {},
  refetchUser: async () => undefined,
  logout: () => {},
  error: null,
});

AuthContext.displayName = "AuthContext";
