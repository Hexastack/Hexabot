/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
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
