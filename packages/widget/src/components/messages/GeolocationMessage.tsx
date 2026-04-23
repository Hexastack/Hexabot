/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import React, { useEffect, useRef, useState } from "react";

import { useWidget } from "../../providers/WidgetProvider";
import { UiMessage } from "../../types/message.types";

import "./GeolocationMessage.scss";

interface GeolocationMessageProps {
  message: UiMessage;
}

const GeolocationMessage: React.FC<GeolocationMessageProps> = ({ message }) => {
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

  return (
    <div
      className={`hb-message--location ${message.direction || "received"}`}
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
          className="hb-message-map"
        />
      )}
    </div>
  );
};

export default GeolocationMessage;
