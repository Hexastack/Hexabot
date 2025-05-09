/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
      {/* eslint-disable-next-line @next/next/no-img-element */}
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
