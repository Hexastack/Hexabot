/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
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
