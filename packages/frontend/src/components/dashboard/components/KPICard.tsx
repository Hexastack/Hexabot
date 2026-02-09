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
        height: "100%",
        borderRadius: 3,
        boxShadow: "0px 2px 10px rgba(0,0,0,0.03)",
        background: `linear-gradient(135deg, ${alpha(mainColor, 0.05)} 0%, ${alpha(mainColor, 0.2)} 100%)`,
        border: `1px solid ${alpha(mainColor, 0.1)}`,
        transition: "transform 0.2s ease-in-out, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: `0 8px 20px ${alpha(mainColor, 0.1)}`,
        },
      }}
    >
      <CardContent
        sx={{
          p: 2.5,
          "&:last-child": { pb: 2.5 },
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Stack
            direction="row"
            justifyContent="center"
            alignItems="center"
            mb={1}
          >
            <Box
              sx={{
                p: 1.25,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${alpha(mainColor, 0.2)} 0%, ${alpha(mainColor, 0.05)} 100%)`,
                color: mainColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {Icon && <Icon size={22} />}
            </Box>
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
