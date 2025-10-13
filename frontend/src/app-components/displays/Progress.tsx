/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Stack,
  CircularProgress,
  styled,
  CircularProgressProps,
} from "@mui/material";

const StyledProgress = styled(Stack)(() => ({
  height: "100vh",
  alignItems: "center",
  placeContent: "center",
}));

export const Progress = (props: CircularProgressProps) => (
  <StyledProgress>
    <CircularProgress color="primary" {...props} />
  </StyledProgress>
);
