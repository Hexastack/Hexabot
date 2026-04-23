/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { MapPin } from "lucide-react";
import React from "react";

import { useChat } from "../../providers/ChatProvider";
import { Web } from "../../types/message.types";

const LocationButton: React.FC = () => {
  const { send } = useChat();
  const locateMe = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          send({
            event,
            source: "geo-location",
            data: {
              type: Web.InboundMessageType.location,
              data: {
                coordinates: {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                },
              },
            },
          });
        },
        (error) => {
          // eslint-disable-next-line no-console
          console.error("Error getting location", error);
        },
      );
    } else {
      // eslint-disable-next-line no-console
      console.error("Geolocation is not supported by this browser.");
    }
  };

  return (
    <div className="hb-user-input--location-wrapper">
      <button
        onClick={locateMe}
        type="button"
        className="hb-user-input--location-icon-wrapper"
      >
        <MapPin className="hb-user-input--location-icon" />
      </button>
    </div>
  );
};

export default LocationButton;
