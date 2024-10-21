/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { FC, PropsWithChildren } from 'react';

import { useColors } from '../providers/ColorProvider';
import { useSettings } from '../providers/SettingsProvider';
import { useWidget } from '../providers/WidgetProvider';

import CloseIcon from './icons/CloseIcon';
import './ChatHeader.scss';

type ChatHeaderProps = PropsWithChildren;

const ChatHeader: FC<ChatHeaderProps> = ({ children }) => {
  const settings = useSettings();
  const { colors } = useColors();
  const widget = useWidget();

  return (
    <div
      className="sc-header"
      style={{ background: colors.header.bg, color: colors.header.text }}
    >
      {children ? (
        children
      ) : (
        <>
          {settings.titleImageUrl && (
            <img
              className="sc-header--img"
              src={settings.titleImageUrl}
              alt=""
            />
          )}
          <div className="sc-header--title">{settings.title}</div>
        </>
      )}
      <div
        className="sc-header--close-button"
        onClick={() => widget.setIsOpen(false)}
      >
        <CloseIcon />
      </div>
    </div>
  );
};

export default ChatHeader;
