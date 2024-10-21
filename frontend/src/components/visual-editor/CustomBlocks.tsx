/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Grid } from "@mui/material";

import PluginIcon from "@/app-components/svg/toolbar/PluginIcon";
import { useFind } from "@/hooks/crud/useFind";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";

import { Block, StyledTitle } from "./Aside";

export const CustomBlocks = () => {
  const { t } = useTranslate();
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
            key={customBlock.id}
            title={t(`title.${customBlock.id}`, { ns: customBlock.id })}
            Icon={PluginIcon}
            blockTemplate={customBlock.template}
            name={customBlock.template.name}
          />
        ))}
      </Grid>
    </>
  ) : null;
};
