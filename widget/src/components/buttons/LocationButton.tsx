/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import React from "react";

import { useChat } from "../../providers/ChatProvider";
import { useSettings } from "../../providers/SettingsProvider";
import { TOutgoingMessageType } from "../../types/message.types";
import LocationIcon from "../icons/LocationIcon";

import "./LocationButton.scss";

const LocationButton: React.FC = () => {
  const { setPayload, send } = useChat();
  const settings = useSettings();
  const locateMe = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPayload({
            coordinates: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
          });
          send({
            event,
            source: "geo-location",
            data: {
              type: TOutgoingMessageType.location,
              data: {
                coordinates: {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                },
              },
            },
          });
          if (settings.autoFlush) {
            setPayload(null);
          }
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
    <div className="sc-user-input--location-wrapper">
      <button
        onClick={locateMe}
        type="button"
        className="sc-user-input--location-icon-wrapper"
      >
        <LocationIcon />
      </button>
    </div>
  );
};

export default LocationButton;
