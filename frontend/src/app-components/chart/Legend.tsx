/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { useChart } from "eazychart-react";
import React, { DOMAttributes, useEffect, useRef, useState } from "react";

import { LegendItem } from "./LegendItem";

export interface LegendProps extends DOMAttributes<HTMLDivElement> {
  onLegendClick?: (key: string, isActive: boolean, color: string) => void;
  onLegendResize?: ({
    width,
    height,
  }: {
    width: number;
    height: number;
  }) => void;
}

export const Legend: React.FC<LegendProps> = ({
  onLegendClick,
  onLegendResize,
  ...rest
}) => {
  const { getScale } = useChart();
  const colorScale = getScale("colorScale");
  const [keyDict, setKeyDict] = useState<{
    [key: string]: string;
  }>({});
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (colorScale) {
      const dict = colorScale.scale
        .domain()
        .reduce((map: any, domainKey: string) => {
          return {
            ...map,
            [domainKey]: colorScale.scale(domainKey),
          };
        }, {});

      setKeyDict(dict);
    }
  }, [colorScale]);

  const handleResize: Function = (entries: ResizeObserverEntry[]) => {
    entries.forEach((entry) => {
      const newDimensions = {
        width: Math.floor(entry.contentRect.width),
        height: Math.floor(entry.contentRect.height),
      };

      onLegendResize && onLegendResize(newDimensions);
    });
  };

  // Else, observe chart parent width & height
  useEffect(() => {
    // Dimensions values has not been set, we need to observe and resize
    const observer = new ResizeObserver((entries) => {
      handleResize(entries);
    });

    observer.observe(ref?.current as Element, {
      box: "border-box",
    });

    return () => {
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="ez-legend" {...rest} ref={ref}>
      {Object.entries(keyDict).map(([key, color]) => {
        return (
          <LegendItem
            key={key}
            onToggle={onLegendClick}
            label={key}
            color={color}
          />
        );
      })}
    </div>
  );
};
