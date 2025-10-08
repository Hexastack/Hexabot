/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { MenuItem, Select } from "@mui/material";
import { FC, Fragment, useState } from "react";

import { ContentContainer } from "@/app-components/dialogs";
import { ICategory } from "@/types/category.types";
import { ComponentFormProps } from "@/types/common/dialogs.types";

export type BlockMoveFormData = {
  row?: never;
  ids: string[];
  onMove: (ids: string[], targetCategoryId: string) => void;
  category: string | undefined;
  categories: ICategory[];
};

export const BlockMoveForm: FC<ComponentFormProps<BlockMoveFormData>> = ({
  data: { defaultValues: props },
  Wrapper = Fragment,
  WrapperProps,
  ...rest
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    string | undefined
  >(props?.category || undefined);
  const handleMove = () => {
    if (selectedCategoryId) {
      props?.onMove(props.ids, selectedCategoryId);
      rest.onSuccess?.();
    }
  };

  return (
    <Wrapper
      onSubmit={handleMove}
      {...WrapperProps}
      confirmButtonProps={{
        ...WrapperProps?.confirmButtonProps,
        disabled: selectedCategoryId === props?.category,
      }}
    >
      <ContentContainer>
        <Select
          value={selectedCategoryId}
          onChange={(e) => setSelectedCategoryId(e.target.value)}
          fullWidth
          displayEmpty
        >
          {props?.categories.map((category) => (
            <MenuItem key={category.id} value={category.id}>
              {category.label}
            </MenuItem>
          ))}
        </Select>
      </ContentContainer>
    </Wrapper>
  );
};
