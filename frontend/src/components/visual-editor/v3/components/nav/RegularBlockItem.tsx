/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { Grid, IconButton, styled, Typography } from "@mui/material";
import { FC, SVGProps } from "react";

import { IBlockAttributes } from "@/types/block.types";
import { SXStyleOptions } from "@/utils/SXStyleOptions";

import { useCreateBlock } from "../../hooks/useCreateBlocks";
import { useVisualEditor } from "../../hooks/useVisualEditor";

const StyledIconButton = styled(IconButton)(
  SXStyleOptions({
    display: "block",
    padding: 2,
    borderRadius: "5px",
    minHeight: "68px",
    width: "100%",
    margin: "auto",
    cursor: "grab",
    "& :active": {
      cursor: "grabbing",
    },
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
const StyledGrid = styled(Grid)<{ disabled: boolean }>(({ disabled }) =>
  SXStyleOptions({
    opacity: disabled ? "0.5" : "0.9",
    borderRadius: 1,
    wordBreak: "break-word",
  }),
);

export const RegularBlockItem = ({
  title,
  Icon,
  disabled,
  blockTemplate,
  name,
}: {
  title: string;
  Icon?: FC<SVGProps<SVGSVGElement>>;
  disabled?: boolean;
  blockTemplate: Partial<IBlockAttributes>;
  name: string;
}) => {
  const { selectedCategoryId } = useVisualEditor();
  const { createNode } = useCreateBlock();

  return (
    <StyledGrid
      disabled={!!disabled}
      item
      xs={6}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(
          "diagram-node",
          JSON.stringify({
            ...blockTemplate,
            name,
          }),
        );
      }}
    >
      <StyledIconButton
        disableTouchRipple
        onClick={() => {
          if (selectedCategoryId) {
            const payload = {
              ...blockTemplate,
              name,
              category: selectedCategoryId,
            } as IBlockAttributes;

            createNode(undefined, payload);
          }
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
