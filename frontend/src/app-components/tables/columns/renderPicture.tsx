/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
