/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ColorState } from "../types/colors.types";

const colors: Record<string, ColorState> = {
  orange: {
    header: {
      bg: "#FF851B",
      text: "#fff",
    },
    launcher: {
      bg: "#FF851B",
    },
    messageList: {
      bg: "#fff",
    },
    sent: {
      bg: "#FF851B",
      text: "#fff",
      hover: "#0074D9",
    },
    received: {
      bg: "#f6f8f9",
      text: "#000",
      hover: "#0074D9",
    },
    userInput: {
      bg: "#fff",
      text: "#000",
    },
    button: {
      bg: "#ffffff",
      text: "#FF851B",
      border: "#FF851B",
    },
    messageStatus: {
      bg: "#FF851B",
    },
    messageTime: {
      text: "#9C9C9C",
    },
  },
  red: {
    header: {
      bg: "#FF4136",
      text: "#fff",
    },
    launcher: {
      bg: "#FF4136",
    },
    messageList: {
      bg: "#fff",
    },
    sent: {
      bg: "#FF4136",
      text: "#fff",
      hover: "#000",
    },
    received: {
      bg: "#f6f8f9",
      text: "#000",
      hover: "#0074D9",
    },
    userInput: {
      bg: "#fff",
      text: "#000",
    },
    button: {
      bg: "#ffffff",
      text: "#FF4136",
      border: "#FF4136",
    },
    messageStatus: {
      bg: "#FF4136",
    },
    messageTime: {
      text: "#FF4136",
    },
  },
  green: {
    header: {
      bg: "#2ECC40",
      text: "#fff",
    },
    launcher: {
      bg: "#2ECC40",
    },
    messageList: {
      bg: "#fff",
    },
    sent: {
      bg: "#2ECC40",
      text: "#fff",
      hover: "#000",
    },
    received: {
      bg: "#f6f8f9",
      text: "#000",
      hover: "#0074D9",
    },
    userInput: {
      bg: "#fff",
      text: "#000",
    },
    button: {
      bg: "#ffffff",
      text: "#2ECC40",
      border: "#2ECC40",
    },
    messageStatus: {
      bg: "#2ECC40",
    },
    messageTime: {
      text: "#2ECC40",
    },
  },
  blue: {
    header: {
      bg: "#0074D9",
      text: "#fff",
    },
    launcher: {
      bg: "#0074D9",
    },
    messageList: {
      bg: "#fff",
    },
    sent: {
      bg: "#0074D9",
      text: "#fff",
      hover: "#000",
    },
    received: {
      bg: "#f6f8f9",
      text: "#000",
      hover: "#0074D9",
    },
    userInput: {
      bg: "#fff",
      text: "#000",
    },
    button: {
      bg: "#ffffff",
      text: "#0074D9",
      border: "#0074D9",
    },
    messageStatus: {
      bg: "#0074D9",
    },
    messageTime: {
      text: "#0074D9",
    },
  },
  teal: {
    header: {
      bg: "#1BA089",
      text: "#fff",
    },
    launcher: {
      bg: "#1BA089",
    },
    messageList: {
      bg: "#fff",
    },
    sent: {
      bg: "#1BA089",
      text: "#fff",
      hover: "#000",
    },
    received: {
      bg: "#f6f8f9",
      text: "#000",
      hover: "#0074D9",
    },
    userInput: {
      bg: "#fff",
      text: "#000",
    },
    button: {
      bg: "#ffffff",
      text: "#1BA089",
      border: "#1BA089",
    },
    messageStatus: {
      bg: "#1BA089",
    },
    messageTime: {
      text: "#9C9C9C",
    },
  },
  dark: {
    header: {
      bg: "#000",
      text: "#ecf0f1",
    },
    launcher: {
      bg: "#000",
    },
    messageList: {
      bg: "#FFF",
    },
    sent: {
      bg: "#000",
      text: "#FFF",
      hover: "#0074D9",
    },
    received: {
      bg: "#f6f8f9",
      text: "#000",
      hover: "#0074D9",
    },
    userInput: {
      bg: "#fff",
      text: "#000",
    },
    button: {
      bg: "#000",
      text: "#ecf0f1",
      border: "#34495e",
    },
    messageStatus: {
      bg: "#95a5a6",
    },
    messageTime: {
      text: "#ffffff",
    },
  },
};

export default colors;
