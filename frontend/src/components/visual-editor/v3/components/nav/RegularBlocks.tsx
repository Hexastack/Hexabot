/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Grid, styled, Typography } from "@mui/material";

import AttachmentIcon from "@/app-components/svg/toolbar/AttachmentIcon";
import ButtonsIcon from "@/app-components/svg/toolbar/ButtonsIcon";
import ListIcon from "@/app-components/svg/toolbar/ListIcon";
import QuickRepliesIcon from "@/app-components/svg/toolbar/QuickRepliesIcon";
import SimpleTextIcon from "@/app-components/svg/toolbar/SimpleTextIcon";
import { useTranslate } from "@/hooks/useTranslate";
import { SXStyleOptions } from "@/utils/SXStyleOptions";

import {
  ATTACHMENT_BLOCK_TEMPLATE,
  BUTTONS_BLOCK_TEMPLATE,
  LIST_BLOCK_TEMPLATE,
  QUICK_REPLIES_BLOCK_TEMPLATE,
  SIMPLE_TEXT_BLOCK_TEMPLATE,
} from "../../constants";

import { RegularBlockItem } from "./RegularBlockItem";

export const StyledTitle = styled(Typography)(
  SXStyleOptions({
    color: "text.primary",
    fontSize: "1.17em",
    fontWeight: "bold",
  }),
);

export const RegularBlocks = () => {
  const { t } = useTranslate();

  return (
    <>
      <Grid mb="2">
        <StyledTitle>{t("title.regular_blocks")}</StyledTitle>
      </Grid>
      <Grid container>
        <RegularBlockItem
          title={t("label.simple_text")}
          Icon={SimpleTextIcon}
          blockTemplate={SIMPLE_TEXT_BLOCK_TEMPLATE}
          name={t("label.simple_text")}
        />
        <RegularBlockItem
          title={t("label.attachment")}
          Icon={AttachmentIcon}
          blockTemplate={ATTACHMENT_BLOCK_TEMPLATE}
          name={t("label.attachment")}
        />
      </Grid>
      <Grid container>
        <RegularBlockItem
          title={t("label.quick_replies")}
          Icon={QuickRepliesIcon}
          blockTemplate={QUICK_REPLIES_BLOCK_TEMPLATE}
          name={t("label.quick_replies")}
        />
        <RegularBlockItem
          title={t("label.buttons")}
          Icon={ButtonsIcon}
          blockTemplate={BUTTONS_BLOCK_TEMPLATE}
          name={t("label.buttons")}
        />
      </Grid>
      <Grid mb="2">
        <StyledTitle>{t("title.advanced_blocks")}</StyledTitle>
      </Grid>
      <Grid container>
        <RegularBlockItem
          title={t("label.list")}
          Icon={ListIcon}
          blockTemplate={LIST_BLOCK_TEMPLATE}
          name={t("label.list")}
        />
      </Grid>
    </>
  );
};
