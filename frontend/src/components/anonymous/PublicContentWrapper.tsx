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
