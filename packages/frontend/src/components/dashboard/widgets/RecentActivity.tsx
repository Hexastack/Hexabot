/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Button, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Filter } from "lucide-react";

import { IconContainer } from "../components/IconContainer";
import { TitleWithActions } from "../components/TitleWithActions";
import { mockRecentActivity } from "../mockData";
import { getIcon } from "../utils/transform.util";

export const RecentActivity = () => {
  const theme = useTheme();

  return (
    <Box>
      <TitleWithActions
        title="Activity"
        actions={
          <Button
            size="small"
            variant="text"
            startIcon={<Filter size={14} />}
            sx={{ borderRadius: 2 }}
          >
            Filter
          </Button>
        }
      />

      <Box sx={{ position: "relative", px: 1 }}>
        <Box
          sx={{
            position: "absolute",
            left: 23,
            top: 16,
            bottom: 10,
            width: 2,
            bgcolor: theme.palette.divider,
          }}
        />

        <Stack spacing={3}>
          {mockRecentActivity.map((event, index) => {
            const IconType = getIcon(event.text);

            return (
              <Box
                key={event.id}
                sx={{ display: "flex", gap: 2, position: "relative" }}
              >
                <Box
                  sx={{
                    width: 32,
                    display: "flex",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      bgcolor: theme.palette.background.paper,
                      border: `2px solid ${index === 0 ? theme.palette.primary.main : theme.palette.divider}`,
                      zIndex: 1,
                      mt: 0.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {index === 0 && (
                      <Box
                        sx={{
                          width: 4,
                          height: 4,
                          borderRadius: "50%",
                          bgcolor: theme.palette.primary.main,
                        }}
                      />
                    )}
                  </Box>
                </Box>

                <Box sx={{ flexGrow: 1 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 0.5,
                    }}
                  >
                    <Typography
                      variant="caption"
                      fontWeight="bold"
                      color="text.secondary"
                    >
                      {event.time}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.5,
                      transition: "all 0.2s",
                      "&:hover": {
                        borderColor: theme.palette.primary.main,
                      },
                    }}
                  >
                    <IconContainer
                      icon={IconType}
                      color={theme.palette.primary.main}
                      borderRadius="16px"
                      size={14}
                    />
                    <Box>
                      <Typography variant="caption">
                        <Box
                          component="span"
                          fontWeight="bold"
                          color="text.primary"
                        >
                          {event.user}
                        </Box>{" "}
                        {event.text.replace(event.user, "").trim()}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Stack>
      </Box>
    </Box>
  );
};
