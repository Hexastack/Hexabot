/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Tab, Tabs } from "@mui/material";
import { useMemo, useState } from "react";

import { useTranslate } from "@/hooks/useTranslate";

const tabId = (index: number) => `inspector-tab-${index}`;
const panelId = (index: number) => `inspector-tabpanel-${index}`;

export const InspectorTabs = () => {
  const { t } = useTranslate();
  const [value, setValue] = useState(0);
  const tabs = useMemo(
    () => [
      { key: "overview", label: t("label.inspector_tabs.overview") },
      { key: "input", label: t("label.inspector_tabs.input") },
      { key: "context", label: t("label.inspector_tabs.context") },
      { key: "output", label: t("label.inspector_tabs.output") },
      { key: "logs_errors", label: t("label.inspector_tabs.logs_errors") },
    ],
    [t],
  );

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <Tabs
        value={value}
        onChange={(_, nextValue) => setValue(nextValue)}
        variant="scrollable"
        allowScrollButtonsMobile
        aria-label={t("label.inspector")}
      >
        {tabs.map((tab, index) => (
          <Tab
            key={tab.key}
            label={tab.label}
            id={tabId(index)}
            aria-controls={panelId(index)}
          />
        ))}
      </Tabs>
      <Box
        role="tabpanel"
        id={panelId(value)}
        aria-labelledby={tabId(value)}
        sx={{
          flex: 1,
          mt: 2,
          border: "1px dashed",
          borderColor: "divider",
          borderRadius: 2,
          backgroundColor: "background.default",
          p: 2,
        }}
      />
    </Box>
  );
};
