/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { SxProps, Theme } from "@mui/material";

export const SXStyleOptions =
  (args: SxProps<Theme>) =>
  ({ theme }: { theme: Theme }) =>
    theme.unstable_sx(args);
