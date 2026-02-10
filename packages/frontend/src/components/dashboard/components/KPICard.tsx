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
        <Box>
          <Stack
            direction="row"
            justifyContent="center"
            alignItems="center"
            mb={1}
          >
            <IconContainer icon={Icon} color={mainColor} borderRadius="16px" />
          </Stack>

          <Typography
            variant="h4"
            component="div"
            fontWeight="800"
            sx={{ mb: 0.5, letterSpacing: "-0.5px", textAlign: "center" }}
          >
            {value}
          </Typography>
        </Box>

        <Stack direction="row" justifyContent="center" spacing={1}>
          <Typography
            variant="body2"
            color="text.secondary"
            fontWeight="medium"
          >
            {title}
          </Typography>
          {subtext && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                opacity: 0.8,
                display: "flex",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              ({subtext})
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};
