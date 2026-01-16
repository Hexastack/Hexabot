/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { StyledOptions } from "@emotion/styled";
import { styled, type Theme } from "@mui/material";
import { useMemo, type ElementType, type FC } from "react";

type IconProps = {
  component: ElementType;
  color?: string;
  htmlColor?: string;
  size?: number | string;
  canRotate?: boolean;
  from?: string;
  to?: string;
};

const createStyledComponent = <C extends ElementType, P extends object = {}>(
  Component: C,
  options?: StyledOptions<P>,
) => {
  return styled(Component as React.ComponentType<any>, options)<P>;
};
const getStyledComponent = (componentType: ElementType) =>
  createStyledComponent(componentType, {
    shouldForwardProp: (prop) =>
      !["canRotate", "from", "to", "htmlColor"].includes(String(prop)),
  })(
    ({
      canRotate = false,
      color,
      htmlColor,
      theme,
      from = "0",
      to = "90",
    }: {
      theme?: Theme;
    } & IconProps) => {
      return {
        fontSize: "18px",
        color: color || htmlColor || theme?.palette.common.white,
        transition: "all 300ms",
        width: "1em",
        height: "1em",
        ...(from && { transform: `rotate(${from}deg)` }),
        ...(canRotate && { transform: `rotate(${to}deg)` }),
      };
    },
  );

export const AnimatedComponent: FC<IconProps> = ({
  component,
  size = "1em",
  ...rest
}) => {
  const StyledComponent = useMemo(
    () => getStyledComponent(component),
    [component],
  );

  return <StyledComponent {...rest} size={size} />;
};
