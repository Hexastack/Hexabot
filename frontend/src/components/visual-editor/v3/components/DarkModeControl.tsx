/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { Panel } from "@xyflow/react";
import { ChangeEventHandler, memo } from "react";

const DarkModeControl = ({
  onChange,
  value,
}: {
  onChange?: ChangeEventHandler<HTMLSelectElement>;
  value?: string;
}) => {
  return (
    <Panel position="top-right">
      <select
        className="xy-theme__select"
        onChange={onChange}
        value={value}
        data-testid="colormode-select"
        aria-label="Color mode"
      >
        <option value="light">light</option>
        <option value="dark">dark</option>
        <option value="system">system</option>
      </select>
    </Panel>
  );
};

export default memo(DarkModeControl);
