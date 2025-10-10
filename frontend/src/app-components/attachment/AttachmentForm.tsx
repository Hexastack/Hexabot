/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { GridEventListener } from "@mui/x-data-grid";
import { FC, Fragment, useState } from "react";

import { MediaLibrary } from "@/components/media-library";
import { IAttachment } from "@/types/attachment.types";
import { ComponentFormProps } from "@/types/common/dialogs.types";

export type AttachmentFormData = {
  row?: undefined;
  accept?: string;
  onChange?: (data?: IAttachment | null) => void;
};

export const AttachmentForm: FC<ComponentFormProps<AttachmentFormData>> = ({
  data: { defaultValues: attachment },
  Wrapper = Fragment,
  WrapperProps,
  ...rest
}) => {
  const [selected, setSelected] = useState<IAttachment | null>(null);
  const handleSelection: GridEventListener<"rowClick"> = (data) => {
    setSelected(data.row);
  };

  return (
    <Wrapper
      onSubmit={() => {
        attachment?.onChange?.(selected);
        rest.onSuccess?.();
      }}
      {...WrapperProps}
      confirmButtonProps={{
        ...WrapperProps?.confirmButtonProps,
        disabled: !selected,
      }}
    >
      <MediaLibrary
        showTitle={false}
        onSelect={handleSelection}
        accept={attachment?.accept}
      />
    </Wrapper>
  );
};
