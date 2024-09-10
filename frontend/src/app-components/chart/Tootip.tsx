/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { TooltipProps } from "eazychart-react";
import { FC, useMemo } from "react";

export const Tooltip: FC<TooltipProps> = ({
  offset = { x: 0, y: 0 },
  datum,
  shapeDatum,
  isVisible,
  mousePosition,
  ...rest
}) => {
  const targetStyle = useMemo(
    () => ({
      left: `${mousePosition.x ? mousePosition.x + offset.x : 0}px`,
      top: `${mousePosition.y ? mousePosition.y + offset.y : 0}px`,
      opacity: isVisible ? 1.0 : 0.0,
    }),
    [mousePosition, isVisible, offset],
  );
  const { _id, _color, _label, ...attributes } = datum || {
    color: undefined,
  };

  return (
    <div className="ez-tooltip" style={targetStyle} {...rest}>
      {datum ? (
        <>
          {shapeDatum?.color ? (
            <div
              className="ez-tooltip-color"
              style={{ backgroundColor: shapeDatum.color }}
            />
          ) : null}
          <div className="ez-tooltip-text">
            {Object.keys(attributes).map((attribute) => {
              return (
                <div
                  key={attribute}
                  className={`ez-tooltip-attribute ${attribute}`}
                >
                  <div className="ez-tooltip-attribute--name">
                    {attribute} :
                  </div>
                  <div className="ez-tooltip-attribute--value">
                    {attribute === "day"
                      ? new Date(datum[attribute]).toISOString()
                      : datum[attribute].toString()}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
};
