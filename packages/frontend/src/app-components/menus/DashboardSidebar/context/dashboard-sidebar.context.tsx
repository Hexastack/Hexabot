/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import * as React from "react";

import { type DashboardSidebarProviderProps } from "../types/sidebar.types";

export const DashboardSidebarContext =
  React.createContext<DashboardSidebarProviderProps | null>(null);
