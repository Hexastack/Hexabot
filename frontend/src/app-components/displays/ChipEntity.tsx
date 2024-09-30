/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Chip, ChipProps } from "@mui/material";

import { useGet } from "@/hooks/crud/useGet";
import { IDynamicProps, TType } from "@/types/base.types";

export const ChipEntity = <TEntity extends IDynamicProps["entity"]>({
  id,
  field,
  entity,
  render = (value) => String(value),
  ...rest
}: {
  id: string;
  variant: ChipProps["variant"];
  field: keyof TType<TEntity>["basic"];
  entity: TEntity;
  render?: (
    value: string | TType<TEntity>["basic"][keyof TType<TEntity>["basic"]],
    data?: TType<TEntity>["basic"],
  ) => string | JSX.Element | JSX.Element[];
}) => {
  const { data } = useGet(id, { entity });
  const fieldValue = data?.[field] ? data[field] : "";
  const renderOutput = render?.(fieldValue, data);

  return data ? (
    typeof renderOutput === "string" ? (
      <Chip
        label={render?.(fieldValue, data) || String(fieldValue)}
        {...rest}
      />
    ) : (
      renderOutput
    )
  ) : null;
};
