/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { LegendClickEventHandler } from "eazychart-core/src/types";
import React, { DOMAttributes, useState } from "react";

export interface LegendItemProps extends DOMAttributes<HTMLDivElement> {
  label: string;
  color: string;
  onToggle?: LegendClickEventHandler;
}

export const LegendItem: React.FC<LegendItemProps> = ({
  label,
  color,
  onToggle,
  ...rest
}) => {
  const [isActive, setIsActive] = useState(true);
  const handleClick = () => {
    if (onToggle) {
      onToggle(label, !isActive, color);
      setIsActive(!isActive);
    }
  };

  return (
    <div
      onClick={handleClick}
      role="button"
      className={`ez-legend-key${!isActive ? " ez-legend-disable" : ""}`}
      style={{
        verticalAlign: "middle",
      }}
      {...rest}
    >
      <div
        className="ez-legend-box"
        style={{
          backgroundColor: isActive ? color : "rgba(255, 255, 255, 0)",
          border: `${color} 2px solid`,
          marginRight: "5px",
          height: "18px",
          display: "inline-block",
        }}
      />
      <span className="ez-legend-text">{label}</span>
    </div>
  );
};
