/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { CheckCircle } from "lucide-react";

import { IconContainer } from "../components/IconContainer";
import { TitleWithActions } from "../components/TitleWithActions";
import { mockAttentionItems } from "../mockData";
import { getSeverityStyles } from "../utils/transform.util";

export const AttentionRequired = () => {
  const theme = useTheme();

  return (
    <Box>
      <TitleWithActions
        title="Attention Required"
        actions={<Chip label={mockAttentionItems.length} color="error" />}
      />
      <Stack spacing={1.5}>
        {mockAttentionItems.map((item) => {
          const styles = getSeverityStyles(item.severity);
          const Icon = styles.Icon;

          return (
            <Paper
              key={item.id}
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: styles.bg,
                border: `1px solid ${styles.border}`,
                display: "flex",
                alignItems: "center",
                gap: 2,
                transition: "transform 0.2s",
                "&:hover": {
                  transform: "translateX(4px)",
                  bgcolor: alpha(styles.bg, 0.15), // slightly darker on hover
                },
              }}
            >
              <IconContainer
                icon={Icon}
                color={styles.icon}
                borderRadius="16px"
                size={20}
              />

              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  {item.title}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ opacity: 0.7, fontWeight: "medium" }}
                >
                  {item.time}
                </Typography>
              </Box>

              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  // TODO: Implement action
                }}
                sx={{
                  minWidth: "auto",
                  borderColor: alpha(styles.icon, 0.3),
                  color: styles.icon,
                  "&:hover": {
                    borderColor: styles.icon,
                    bgcolor: alpha(styles.icon, 0.05),
                  },
                }}
              >
                {item.action}
              </Button>
            </Paper>
          );
        })}

        {mockAttentionItems.length === 0 && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: alpha(theme.palette.success.main, 0.05),
              border: `1px dashed ${alpha(theme.palette.success.main, 0.3)}`,
              textAlign: "center",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mb: 1.5,
                color: theme.palette.success.main,
              }}
            >
              <CheckCircle size={32} />
            </Box>
            <Typography variant="subtitle1" fontWeight="bold">
              All Systems Operational
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No items require attention at this time.
            </Typography>
          </Paper>
        )}
      </Stack>
    </Box>
  );
};
