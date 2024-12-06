/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import React, { useEffect, useState } from "react";

import { useTranslation } from "../hooks/useTranslation";
import { useChat } from "../providers/ChatProvider";
import { useColors } from "../providers/ColorProvider";

import BackIcon from "./icons/BackIcon";
import "./Webview.scss";

const Webview: React.FC = () => {
  const { t } = useTranslation();
  const { colors } = useColors();
  const { setWebviewUrl, webviewUrl } = useChat();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  const close = () => {
    setWebviewUrl("");
  };

  return (
    <div className="sc-webview">
      {loaded && webviewUrl && (
        <iframe src={webviewUrl} title="webview" frameBorder="0" />
      )}
      <div
        className="sc-webview--footer"
        style={{ background: colors.header.bg, color: colors.header.text }}
      >
        <h3 className="sc-webview--button" onClick={close}>
          <BackIcon width="16px" height="16px" />
          {t("settings.back")}
        </h3>
      </div>
    </div>
  );
};

export default Webview;
