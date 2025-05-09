/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
