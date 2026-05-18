/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Box,
  IconButton,
  Link,
  Popover,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { CircleQuestionMark } from "lucide-react";
import { useState } from "react";

import { useTranslate } from "@/hooks/useTranslate";

const JSONATA_DOCUMENTATION_URL = "https://docs.jsonata.org/overview";
const HEXABOT_EXPRESSIONS_DOCUMENTATION_URL =
  "https://docs.hexabot.ai/workflow-editor/expressions-and-jsonata-scopes";

export const DynamicValueHelp = () => {
  const { t } = useTranslate();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const closePopover = (event?: { stopPropagation?: () => void }) => {
    event?.stopPropagation?.();
    setAnchor(null);
  };

  return (
    <>
      <Tooltip
        title={t("visual_editor.actions_drawer.form.dynamic_values_help.open")}
      >
        <IconButton
          size="small"
          onClick={(event) => {
            event.stopPropagation();
            setAnchor(event.currentTarget);
          }}
          aria-label={t(
            "visual_editor.actions_drawer.form.dynamic_values_help.open",
          )}
        >
          <CircleQuestionMark size={16} />
        </IconButton>
      </Tooltip>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={(event) =>
          closePopover(event as { stopPropagation?: () => void })
        }
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          backdrop: {
            onClick: (event) => event.stopPropagation(),
            onMouseDown: (event) => event.stopPropagation(),
            sx: { zIndex: 0 },
          },
          paper: {
            onClick: (event) => event.stopPropagation(),
            onMouseDown: (event) => event.stopPropagation(),
            sx: {
              width: 320,
              maxWidth: "calc(100vw - 32px)",
              p: 2,
              zIndex: 1,
            },
          },
        }}
      >
        <Stack spacing={1}>
          <Typography variant="subtitle2">
            {t("visual_editor.actions_drawer.form.dynamic_values_help.title")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("visual_editor.actions_drawer.form.dynamic_values_help.static")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("visual_editor.actions_drawer.form.dynamic_values_help.dynamic")}
          </Typography>
          <Box>
            {["$input", "$output", "$context"].map((source) => (
              <Typography
                key={source}
                variant="body2"
                component="span"
                sx={{
                  display: "inline-block",
                  mr: 1,
                  fontFamily: "monospace",
                  color: "text.primary",
                }}
              >
                {source}
              </Typography>
            ))}
          </Box>
          <Typography variant="caption" color="text.secondary">
            {t(
              "visual_editor.actions_drawer.form.dynamic_values_help.technical",
            )}
          </Typography>
          <Stack direction="row" gap={1.5} flexWrap="wrap">
            <Link
              href={HEXABOT_EXPRESSIONS_DOCUMENTATION_URL}
              target="_blank"
              rel="noopener noreferrer"
              variant="caption"
            >
              {t("visual_editor.actions_drawer.form.dynamic_values_help.docs")}
            </Link>
            <Link
              href={JSONATA_DOCUMENTATION_URL}
              target="_blank"
              rel="noopener noreferrer"
              variant="caption"
            >
              {t(
                "visual_editor.actions_drawer.form.dynamic_values_help.jsonata_docs",
              )}
            </Link>
          </Stack>
        </Stack>
      </Popover>
    </>
  );
};
