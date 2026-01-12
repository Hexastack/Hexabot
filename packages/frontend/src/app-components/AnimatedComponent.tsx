/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { StyledOptions } from "@emotion/styled";
import { styled, type Theme } from "@mui/material";
import { useMemo, type FC } from "react";

type IconProps = {
  component: React.ComponentType<any>;
  htmlColor?: string;
  canRotate?: boolean;
  from?: string;
  to?: string;
};

const createStyledComponent = <
  C extends React.ComponentType<any>,
  P extends object = {},
>(
  Component: C,
  options?: StyledOptions<P>,
) => {
  return styled(Component as React.ComponentType<any>, options)<P>;
};
const getStyledComponent = <C extends React.ComponentType<C>>(
  componentType: C,
) =>
  createStyledComponent(componentType, {
    shouldForwardProp: (prop) => prop !== "canRotate",
  })(
    ({
      canRotate = false,
      htmlColor,
      theme,
      from = "0",
      to = "90",
    }: {
      theme?: Theme;
    } & IconProps) => {
      return {
        fontSize: "18px",
        color: htmlColor || theme?.palette.common.white,
        transition: "all 300ms",
        ...(from && { transform: `rotate(${from}deg)` }),
        ...(canRotate && { transform: `rotate(${to}deg)` }),
      };
    },
  );

export const AnimatedComponent: FC<IconProps> = ({ component, ...rest }) => {
  const StyledComponent = useMemo(
    () => getStyledComponent(component),
    [component],
  );

  return <StyledComponent {...rest} />;
};
