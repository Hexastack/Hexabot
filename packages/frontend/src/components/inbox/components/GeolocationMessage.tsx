/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { StdIncomingLocationMessage } from "@hexabot-ai/types";
import Box from "@mui/material/Box";
import { useRef } from "react";

import { useTranslate } from "@/hooks/useTranslate";

export interface GeolocationMessageProps {
  message: StdIncomingLocationMessage;
}

const GeolocationMessage: React.FC<GeolocationMessageProps> = ({ message }) => {
  const embedWidth = 200;
  const embedHeight = 150;
  const iframeRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslate();
  const { lat, lon } = message.data.coordinates ?? { lat: 0, lon: 0 };
  const openStreetMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${
    lon - 0.1
  },${lat - 0.1},${lon + 0.1},${lat + 0.1}&layer=mapnik&marker=${lat},${lon}`;

  return (
    <Box
      ref={iframeRef}
      sx={{
        width: embedWidth,
        overflow: "hidden",
        borderRadius: 1.5,
        border: 1,
        borderColor: "divider",
      }}
    >
      <Box
        component="iframe"
        title={t("title.user_location")}
        loading="lazy"
        frameBorder="0"
        scrolling="no"
        marginHeight={0}
        marginWidth={0}
        src={openStreetMapUrl}
        sx={{
          display: "block",
          width: embedWidth,
          height: embedHeight,
          border: 0,
          borderRadius: 1.5,
          backgroundColor: "background.default",
        }}
      />
    </Box>
  );
};

export default GeolocationMessage;
