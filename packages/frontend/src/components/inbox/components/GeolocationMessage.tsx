/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useRef } from "react";

import { StdIncomingLocationMessage } from "@/types/message.types";

export interface GeolocationMessageProps {
  message: StdIncomingLocationMessage;
}

const GeolocationMessage: React.FC<GeolocationMessageProps> = ({ message }) => {
  const iframeRef = useRef<HTMLDivElement>(null);

  if (!("coordinates" in message)) {
    throw new Error("Unable to find coordinates");
  }

  const { lat, lon } = message.coordinates || { lat: 0.0, lng: 0.0 };
  const openStreetMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${
    lon - 0.1
  },${lat - 0.1},${lon + 0.1},${lat + 0.1}&layer=mapnik&marker=${lat},${lon}`;

  return (
    <div
      style={{
        borderRadius: "0.5rem",
        width: "200px",
      }}
      ref={iframeRef}
    >
      <iframe
        style={{
          width: "200px",
          height: "150px",
          borderRadius: "0.5rem",
        }}
        loading="lazy"
        frameBorder="0"
        scrolling="no"
        marginHeight={0}
        marginWidth={0}
        src={openStreetMapUrl}
      />
    </div>
  );
};

export default GeolocationMessage;
