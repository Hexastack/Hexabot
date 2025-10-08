/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { Grid } from "@mui/material";
import { GridRenderCellParams } from "@mui/x-data-grid";

import { getAvatarSrc } from "@/components/inbox/helpers/mapMessages";
import { useConfig } from "@/hooks/useConfig";
import { EntityType } from "@/services/types";

export const buildRenderPicture = (
  entityType: EntityType.USER | EntityType.SUBSCRIBER,
) =>
  function RenderPicture(params: GridRenderCellParams) {
    const { apiUrl } = useConfig();

    return (
      <Grid
        container
        sx={{
          height: "100%",
          alignContent: "center",
          justifyContent: "center",
        }}
      >
        <img
          src={getAvatarSrc(apiUrl, entityType, params.row.id)}
          style={{ width: "36px", height: "36px" }}
        />
      </Grid>
    );
  };
