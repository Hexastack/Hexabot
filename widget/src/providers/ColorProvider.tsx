/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import React, { createContext, ReactNode, useContext } from 'react';

import { useSettings } from './SettingsProvider';
import colors from '../constants/colors';
import { ColorState } from '../types/colors.types';

const initialState: ColorState = colors['orange'];
const ColorContext = createContext<{
  colors: ColorState;
}>({
  colors: initialState,
});

export const ColorProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const settings = useSettings();

  return (
    <ColorContext.Provider value={{ colors: colors[settings.color] }}>
      {children}
    </ColorContext.Provider>
  );
};

export const useColors = () => {
  const context = useContext(ColorContext);

  if (!context) {
    throw new Error('useColors must be used within a ColorProvider');
  }

  return context;
};
