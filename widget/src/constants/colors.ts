/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { ColorState } from '../types/colors.types';

const colors: Record<string, ColorState> = {
  orange: {
    header: {
      bg: '#E6A23D',
      text: '#fff',
    },
    launcher: {
      bg: '#E6A23D',
    },
    messageList: {
      bg: '#fff',
    },
    sent: {
      bg: '#E6A23D',
      text: '#fff',
    },
    received: {
      bg: '#eaeaea',
      text: '#222222',
    },
    userInput: {
      bg: '#fff',
      text: '#212121',
    },
    button: {
      bg: '#ffffff',
      text: '#E6A23D',
      border: '#E6A23D',
    },
    messageStatus: {
      bg: '#E6A23D',
    },
    messageTime: {
      text: '#9C9C9C',
    },
  },
  red: {
    header: {
      bg: '#AB1251',
      text: '#fff',
    },
    launcher: {
      bg: '#AB1251',
    },
    messageList: {
      bg: '#fff',
    },
    sent: {
      bg: '#AB1251',
      text: '#fff',
    },
    received: {
      bg: '#eaeaea',
      text: '#222222',
    },
    userInput: {
      bg: '#fff',
      text: '#212121',
    },
    button: {
      bg: '#ffffff',
      text: '#AB1251',
      border: '#AB1251',
    },
    messageStatus: {
      bg: '#AB1251',
    },
    messageTime: {
      text: '#9C9C9C',
    },
  },
  green: {
    header: {
      bg: '#ABBD49',
      text: '#fff',
    },
    launcher: {
      bg: '#ABBD49',
    },
    messageList: {
      bg: '#fff',
    },
    sent: {
      bg: '#4CAF50',
      text: '#fff',
    },
    received: {
      bg: '#eaeaea',
      text: '#222222',
    },
    userInput: {
      bg: '#fff',
      text: '#212121',
    },
    button: {
      bg: '#ffffff',
      text: '#ABBD49',
      border: '#ABBD49',
    },
    messageStatus: {
      bg: '#ABBD49',
    },
    messageTime: {
      text: '#9C9C9C',
    },
  },
  blue: {
    header: {
      bg: '#108AA8',
      text: '#ffffff',
    },
    launcher: {
      bg: '#108AA8',
    },
    messageList: {
      bg: '#ffffff',
    },
    sent: {
      bg: '#108AA8',
      text: '#ffffff',
    },
    received: {
      bg: '#eaeaea',
      text: '#222222',
    },
    userInput: {
      bg: '#f4f7f9',
      text: '#565867',
    },
    button: {
      bg: '#ffffff',
      text: '#108AA8',
      border: '#108AA8',
    },
    messageStatus: {
      bg: '#108AA8',
    },
    messageTime: {
      text: '#9C9C9C',
    },
  },
  teal: {
    header: {
      bg: '#279084',
      text: '#ffffff',
    },
    launcher: {
      bg: '#279084',
    },
    messageList: {
      bg: '#ffffff',
    },
    sent: {
      bg: '#279084',
      text: '#ffffff',
    },
    received: {
      bg: '#eaeaea',
      text: '#222222',
    },
    userInput: {
      bg: '#f4f7f9',
      text: '#565867',
    },
    button: {
      bg: '#ffffff',
      text: '#279084',
      border: '#279084',
    },
    messageStatus: {
      bg: '#279084',
    },
    messageTime: {
      text: '#9C9C9C',
    },
  },
  dark: {
    header: {
      bg: '#34495e',
      text: '#ecf0f1',
    },
    launcher: {
      bg: '#34495e',
    },
    messageList: {
      bg: '#2c3e50',
    },
    sent: {
      bg: '#7f8c8d',
      text: '#ecf0f1',
    },
    received: {
      bg: '#95a5a6',
      text: '#ecf0f1',
    },
    userInput: {
      bg: '#34495e',
      text: '#ecf0f1',
    },
    button: {
      bg: '#2c3e50',
      text: '#ecf0f1',
      border: '#34495e',
    },
    messageStatus: {
      bg: '#95a5a6',
    },
    messageTime: {
      text: '#ffffff',
    },
  },
};

export default colors;
