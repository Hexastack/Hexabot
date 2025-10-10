/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { CircularProgress, Grid } from "@mui/material";
import { FC } from "react";

import { useAuth } from "@/hooks/useAuth";

export type PublicContentWrapperProps = { children: React.ReactNode };
export const PublicContentWrapper: FC<PublicContentWrapperProps> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();

  return (
    <Grid container justifyContent="center">
      {isAuthenticated ? <CircularProgress /> : children}
    </Grid>
  );
};
