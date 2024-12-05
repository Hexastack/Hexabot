/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import React, { useEffect, useRef, useState } from "react";

import { useColors } from "../../providers/ColorProvider";
import { useWidget } from "../../providers/WidgetProvider";
import { Direction, TMessage } from "../../types/message.types";

import "./GeolocationMessage.scss";

interface GeolocationMessageProps {
  message: TMessage;
}

const GeolocationMessage: React.FC<GeolocationMessageProps> = ({ message }) => {
  const { colors: allColors } = useColors();
  const widget = useWidget();
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

  useEffect(() => {
    if (isSeen && widget && widget.scroll > 85) {
      widget.scroll = 101;
    }
  }, [isSeen, widget]);

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
      className="sc-message--location"
      style={{
        color: colors.text,
        backgroundColor: colors.bg,
      }}
      ref={iframeRef}
    >
      {isSeen && (
        <iframe
          loading="lazy"
          frameBorder="0"
          scrolling="no"
          marginHeight={0}
          marginWidth={0}
          src={openStreetMapUrl}
          className="sc-message-map"
        />
      )}
    </div>
  );
};

export default GeolocationMessage;
