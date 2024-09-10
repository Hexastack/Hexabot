/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { Grid } from "@mui/material";
import { useTranslation } from "react-i18next";

import PluginIcon from "@/app-components/svg/toolbar/PluginIcon";
import { useFind } from "@/hooks/crud/useFind";
import { EntityType } from "@/services/types";

import { Block, StyledTitle } from "./Aside";

export const CustomBlocks = () => {
  const { t } = useTranslation();
  const { data: customBlocks } = useFind(
    { entity: EntityType.CUSTOM_BLOCK },
    { hasCount: false },
  );

  return customBlocks?.length ? (
    <>
      <Grid mb="2">
        <StyledTitle>{t("title.custom_blocks")}</StyledTitle>
      </Grid>
      <Grid container>
        {customBlocks?.map((customBlock) => (
          <Block
            key={customBlock.name}
            title={customBlock.title}
            Icon={PluginIcon}
            blockTemplate={customBlock.template}
            name={customBlock.template.name}
          />
        ))}
      </Grid>
    </>
  ) : null;
};
