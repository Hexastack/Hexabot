/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Tooltip, Typography } from "@mui/material";
import { LoaderCircle, LucideIcon } from "lucide-react";

import { useTranslate } from "@/hooks/useTranslate";
import { TTranslationKeys } from "@/i18n/i18n.types";

export type BadgeWithTitleProps = {
  title?: string;
  icon?: LucideIcon;
  color?: string;
  background?: string;
  width?: string;
  height?: string;
  selected?: boolean;
  disableTooltip?: boolean;
  padding?: string;
  isLoading?: boolean;
  labelKey?: TTranslationKeys;
};

export const BadgeWithTitle = ({ title, ...rest }: BadgeWithTitleProps) => {
  const { t } = useTranslate();

  return (
    <Box gap={1} display="flex" alignItems="stretch">
      <Box display="flex" alignItems="center" justifyContent="center">
        <Badge {...rest} />
      </Box>
      <Typography variant="subtitle2" textTransform="capitalize">
        {rest.labelKey ? t(rest.labelKey, { defaultValue: title }) : title}
      </Typography>
    </Box>
  );
};

export const Badge = ({
  icon: Icon,
  color,
  height = "24px",
  width = "24px",
  title,
  selected,
  disableTooltip,
  padding = "2px",
  isLoading,
}: BadgeWithTitleProps) => {
  if (!Icon) {
    return null;
  }

  return (
    <Tooltip
      title={title}
      arrow
      disableHoverListener={!title || disableTooltip}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color,
          minWidth: width,
          minHeight: height,
          maxWidth: width,
          maxHeight: height,
          zIndex: 4,
          border: (theme) =>
            `2px solid ${selected ? theme.alpha(theme.vars.palette.primary.main, 0.8) : theme.alpha(theme.vars.palette.text.primary, 0.05)}`,
          background: `color-mix(in srgb, transparent, ${color} ${selected ? "25%" : "10%"})`,
          flexShrink: 0,
          borderRadius: (theme) => (theme.shape.borderRadius as number) + 1,
          transform: selected ? "scale(1.1)" : "scale(1)",
          transition: "0.2s",
          ...(isLoading && { animation: "rotate infinite 700ms linear" }),
          "@keyframes rotate": {
            from: {
              transform: "rotate(0deg)",
            },
            to: {
              transform: "rotate(360deg)",
            },
          },
        }}
      >
        {isLoading ? (
          <LoaderCircle />
        ) : (
          <Icon size="100%" style={{ padding }} />
        )}
      </Box>
    </Tooltip>
  );
};
