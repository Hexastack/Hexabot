/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Direction } from "hexabot-chat-widget/src/types/message.types";
import { useEffect, useRef, useState } from "react";

export interface GeolocationMessageProps {
  message: {
    type: string;
    data: {
      coordinates: {
        lat: number;
        lng: number;
      };
    };
    author: string;
    read: boolean;
    mid: string;
    createdAt: string | Date;
    direction: Direction;
    delivery: boolean;
  };
}

const GeolocationMessage: React.FC<GeolocationMessageProps> = ({ message }) => {
  // const { colors: allColors } = useColors();
  // const widget = useWidget();
  const allColors = {
    header: { bg: "#1BA089", text: "#fff" },
    launcher: { bg: "#1BA089" },
    messageList: { bg: "#fff" },
    sent: { bg: "#1BA089", text: "#fff" },
    received: { bg: "#f6f8f9", text: "#000" },
    userInput: { bg: "#fff", text: "#000" },
    button: { bg: "#ffffff", text: "#1BA089", border: "#1BA089" },
    messageStatus: { bg: "#1BA089" },
    messageTime: { text: "#9C9C9C" },
  };
  const [isSeen, setIsSeen] = useState(false);
  const iframeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (!isSeen && entries[0].intersectionRatio > 0) {
        setIsSeen(true);
      }
    });

    if (iframeRef.current) {
      observer.observe(iframeRef.current);
    }

    return () => {
      if (iframeRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        observer.unobserve(iframeRef.current);
      }
    };
  }, [isSeen]);

  if (!("coordinates" in message.data)) {
    throw new Error("Unable to find coordinates");
  }
  const coordinates = message.data?.coordinates || { lat: 0.0, lng: 0.0 };
  const openStreetMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${
    coordinates.lng - 0.1
  },${coordinates.lat - 0.1},${coordinates.lng + 0.1},${
    coordinates.lat + 0.1
  }&layer=mapnik&marker=${coordinates.lat},${coordinates.lng}`;
  const colors = allColors[message.direction || Direction.received];

  return (
    <div
      style={{
        borderRadius: "0.5rem",
        backgroundColor: colors.bg,
        color: colors.text,
        width: "200px",
      }}
      ref={iframeRef}
    >
      {isSeen && (
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
      )}
    </div>
  );
};

export default GeolocationMessage;
