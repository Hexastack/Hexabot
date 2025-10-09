/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { FC, Fragment } from "react";

import { ComponentFormProps } from "@/types/common/dialogs.types";

export type AttachmentViewerFormData = {
  row?: never;
  url?: string;
  name?: string;
};

export const AttachmentViewerForm: FC<
  ComponentFormProps<AttachmentViewerFormData>
> = ({
  data: { defaultValues: attachment },
  Wrapper = Fragment,
  WrapperProps,
}) => {
  return (
    <Wrapper {...WrapperProps}>
      <img
        width="100%"
        style={{
          cursor: "pointer",
          objectFit: "contain",
          maxHeight: "70vh",
        }}
        alt={attachment?.url}
        src={attachment?.url}
      />
    </Wrapper>
  );
};
