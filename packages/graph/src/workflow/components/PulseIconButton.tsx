/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { IconButtonProps } from "@mui/material";
import { IconButton } from "@mui/material";
import { keyframes, styled, useColorScheme } from "@mui/material/styles";

const pulse = keyframes`
  0% {
    transform: scale(0.95);
    opacity: 0.6;
  }
  70% {
    transform: scale(1.6);
    opacity: 0;
  }
  100% {
    transform: scale(1.6);
    opacity: 0;
  }
`;

type PulseIconButtonProps = Omit<IconButtonProps, "size"> & {
  size?: number;
};

type PulseIconButtonRootProps = Omit<IconButtonProps, "size"> & {
  pulseSize: number;
};

const PulseIconButtonRoot = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== "pulseSize",
})<PulseIconButtonRootProps>(({ theme, pulseSize }) => {
  const ringInset = Math.max(4, Math.round(pulseSize * 0.14));
  const { mode } = useColorScheme();
  const isDarkMode = mode === "dark";

  return {
    position: "relative",
    zIndex: 0,
    pointerEvents: "auto",
    width: pulseSize,
    height: pulseSize,
    padding: 0,
    borderRadius: "50%",
    border: `1px dashed ${isDarkMode ? theme.palette.grey[600] : theme.palette.grey[400]}`,
    backgroundColor: isDarkMode
      ? theme.palette.common.black
      : theme.palette.common.white,
    color: theme.typography.body1.color,
    boxShadow: theme.shadows[1],
    transition: ".2s",
    "&::after": {
      content: '""',
      position: "absolute",
      inset: -ringInset,
      borderRadius: "50%",
      border: `1px solid ${theme.palette.primary.main}`,
      opacity: 0,
      animation: `${pulse} 1.8s ease-out infinite`,
      pointerEvents: "none",
      zIndex: -1,
    },
    "&:hover": {
      backgroundColor: `color-mix(in srgb, ${
        isDarkMode ? theme.palette.common.black : theme.palette.common.white
      }, ${
        isDarkMode ? theme.palette.common.white : theme.palette.common.black
      } 15%)`,
    },
    "@media (prefers-reduced-motion: reduce)": {
      "&::after": {
        animation: "none",
      },
    },
  };
});

export const PulseIconButton = ({
  size = 56,
  ...props
}: PulseIconButtonProps) => {
  return <PulseIconButtonRoot {...props} pulseSize={size} />;
};
