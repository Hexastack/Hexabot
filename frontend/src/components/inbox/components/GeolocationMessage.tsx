/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
