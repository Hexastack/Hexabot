/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Grid } from "@mui/material";
import { useMemo } from "react";

import PluginIcon from "@/app-components/svg/toolbar/PluginIcon";
import { useFind } from "@/hooks/crud/useFind";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";

import { RegularBlockItem } from "./RegularBlockItem";
import { StyledTitle } from "./RegularBlocks";

export const CustomBlocks = () => {
  const { t } = useTranslate();
  const { data: customBlocks = [] } = useFind(
    { entity: EntityType.CUSTOM_BLOCK },
    { hasCount: false },
  );
  const memoizedCustomBlocks = useMemo(
    () => customBlocks.sort((a, b) => a.id.localeCompare(b.id)),
    [customBlocks],
  );

  return memoizedCustomBlocks.length ? (
    <>
      <Grid mb="2">
        <StyledTitle>{t("title.custom_blocks")}</StyledTitle>
      </Grid>
      <Grid container>
        {memoizedCustomBlocks.map((customBlock) => (
          <RegularBlockItem
            key={customBlock.id}
            title={t(`title.${customBlock.namespace}`, {
              ns: customBlock.namespace,
            })}
            Icon={PluginIcon}
            blockTemplate={customBlock.template}
            name={customBlock.template.name}
          />
        ))}
      </Grid>
    </>
  ) : null;
};
