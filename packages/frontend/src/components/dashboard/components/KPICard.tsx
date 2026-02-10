/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  alpha,
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";

import { getColor } from "../utils/transform.util";

import { IconContainer } from "./IconContainer";

export const KPICard = ({
  title,
  value,
  subtext,
  icon: Icon,
  color = "primary",
}: any) => {
  const mainColor = getColor(color);

  return (
    <Card
      sx={{
        borderRadius: 3,
        background: `linear-gradient(135deg, ${alpha(mainColor, 0.05)} 0%, ${alpha(mainColor, 0.2)} 100%)`,
        border: `1px solid ${alpha(mainColor, 0.33)}`,
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: `0 8px 20px ${alpha(mainColor, 0.1)}`,
        },
      }}
    >
      <CardContent>
        <Box textAlign="center">
          <Stack alignItems="center" mb={1}>
            <IconContainer icon={Icon} color={mainColor} borderRadius="16px" />
          </Stack>
          <Typography variant="h4">{value}</Typography>
        </Box>

        <Stack direction="row" justifyContent="center" spacing={1}>
          <Typography>{title}</Typography>
          {subtext && (
            <Typography color="text.secondary">({subtext})</Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};
