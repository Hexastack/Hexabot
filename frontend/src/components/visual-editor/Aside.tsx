/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Grid, IconButton, Paper, Typography, styled } from "@mui/material";
import { FC, SVGProps } from "react";

import AttachmentIcon from "@/app-components/svg/toolbar/AttachmentIcon";
import ButtonsIcon from "@/app-components/svg/toolbar/ButtonsIcon";
import ListIcon from "@/app-components/svg/toolbar/ListIcon";
import QuickRepliesIcon from "@/app-components/svg/toolbar/QuickRepliesIcon";
import SimpleTextIcon from "@/app-components/svg/toolbar/SimpleTextIcon";
import { useTranslate } from "@/hooks/useTranslate";
import { IBlockAttributes } from "@/types/block.types";
import { SXStyleOptions } from "@/utils/SXStyleOptions";

import {
  ATTACHMENT_BLOCK_TEMPLATE,
  BUTTONS_BLOCK_TEMPLATE,
  LIST_BLOCK_TEMPLATE,
  QUICK_REPLIES_BLOCK_TEMPLATE,
  SIMPLE_TEXT_BLOCK_TEMPLATE,
} from "./constants";
import { CustomBlocks } from "./CustomBlocks";
import { useVisualEditor } from "./hooks/useVisualEditor";

const StyledIconButton = styled(IconButton)(
  SXStyleOptions({
    display: "block",
    padding: 2,
    borderRadius: "5px",
    minHeight: "68px",
    width: "100%",
    margin: "auto",
  }),
);
const StyledBlockTitle = styled(Typography)(
  SXStyleOptions({
    color: "text.primary",
    display: "block",
    fontSize: ".75rem",
    marginTop: 0.8,
    clear: "both",
  }),
);

export const StyledTitle = styled(Typography)(
  SXStyleOptions({
    color: "text.primary",
    fontSize: "1.17em",
    fontWeight: "bold",
  }),
);

const StyledGrid = styled(Grid)<{ disabled: boolean }>(({ disabled }) =>
  SXStyleOptions({
    opacity: disabled ? "0.5" : "0.9",
    borderRadius: 1,
  }),
);

export const Block = ({
  title,
  Icon,
  disabled,
  blockTemplate,
  name,
}: {
  title: string;
  Icon?: FC<SVGProps<SVGSVGElement>>;
  disabled?: boolean;
  onClick?: () => void;
  blockTemplate: Partial<IBlockAttributes>;
  name: string;
}) => {
  const { createNode } = useVisualEditor();

  return (
    <StyledGrid
      disabled={!!disabled}
      item
      xs={6}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData(
          "storm-diagram-node",
          JSON.stringify({
            ...blockTemplate,
            name,
          }),
        );
      }}
    >
      <StyledIconButton
        onClick={() => {
          const payload = {
            ...blockTemplate,
            name,
          };

          createNode(payload);
        }}
        disabled={disabled}
      >
        <div>
          {Icon ? <Icon width="32px" height="32px" /> : null}
          <StyledBlockTitle>{title}</StyledBlockTitle>
        </div>
      </StyledIconButton>
    </StyledGrid>
  );
};

const Aside = () => {
  const { t } = useTranslate();

  return (
    <Grid
      item
      sx={{
        position: "relative",
        height: "100%",
      }}
    >
      <Paper
        sx={{
          width: "220px",
          height: "100%",
          overflow: "auto",
          borderRadius: "0px",
          borderRight: "1px solid #E0E0E0",
        }}
      >
        <Grid p={1}>
          <Grid mb="2">
            <StyledTitle>{t("title.regular_blocks")}</StyledTitle>
          </Grid>
          <Grid container>
            <Block
              title={t("label.simple_text")}
              Icon={SimpleTextIcon}
              blockTemplate={SIMPLE_TEXT_BLOCK_TEMPLATE}
              name={t("label.simple_text")}
            />
            <Block
              title={t("label.attachment")}
              Icon={AttachmentIcon}
              blockTemplate={ATTACHMENT_BLOCK_TEMPLATE}
              name={t("label.attachment")}
            />
          </Grid>
          <Grid container>
            <Block
              title={t("label.quick_replies")}
              Icon={QuickRepliesIcon}
              blockTemplate={QUICK_REPLIES_BLOCK_TEMPLATE}
              name={t("label.quick_replies")}
            />
            <Block
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
            <Block
              title={t("label.list")}
              Icon={ListIcon}
              blockTemplate={LIST_BLOCK_TEMPLATE}
              name={t("label.list")}
            />
          </Grid>
          <CustomBlocks />
        </Grid>
      </Paper>
    </Grid>
  );
};

export default Aside;
