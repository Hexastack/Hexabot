/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
  category: string;
  categories: ICategory[];
};

export const BlockMoveForm: FC<ComponentFormProps<BlockMoveFormData>> = ({
  data,
  Wrapper = Fragment,
  WrapperProps,
  ...rest
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    data?.category || "",
  );
  const handleMove = () => {
    if (selectedCategoryId) {
      data?.onMove(data.ids, selectedCategoryId);
      rest.onSuccess?.();
    }
  };

  return (
    <Wrapper
      onSubmit={handleMove}
      {...WrapperProps}
      confirmButtonProps={{
        ...WrapperProps?.confirmButtonProps,
        disabled: selectedCategoryId === data?.category,
      }}
    >
      <ContentContainer>
        <Select
          value={selectedCategoryId}
          onChange={(e) => setSelectedCategoryId(e.target.value as string)}
          fullWidth
          displayEmpty
        >
          {data?.categories.map((category) => (
            <MenuItem key={category.id} value={category.id}>
              {category.label}
            </MenuItem>
          ))}
        </Select>
      </ContentContainer>
    </Wrapper>
  );
};
