/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

// Core i18next library.
import i18n from "i18next";
// Bindings for React: allow components to
// re-render when language changes.
import getConfig from "next/config";
import { initReactI18next } from "react-i18next";

import enChatbotTranslations from "./en/chatbot_settings.json";
import enContactTranslations from "./en/contact.json";
import enTranslations from "./en/translation.json";
import frChatbotTranslations from "./fr/chatbot_settings.json";
import frContactTranslations from "./fr/contact.json";
import frTranslations from "./fr/translation.json";

const { publicRuntimeConfig } = getConfig();

i18n.use(initReactI18next).init({
  lng: publicRuntimeConfig.lang.default,
  fallbackLng: "en",
  debug: true,
  resources: {
    en: {
      translation: enTranslations,
      chatbot_settings: enChatbotTranslations,
      contact: enContactTranslations,
    },
    fr: {
      translation: frTranslations,
      chatbot_settings: frChatbotTranslations,
      contact: frContactTranslations,
    },
  },
  interpolation: {
    escapeValue: false,
  },
});

i18n.services.formatter?.add("dateFormat", (value, lng, options) =>
  new Intl.DateTimeFormat(lng, options?.formatParams?.val).format(
    new Date(options?.date || value),
  ),
);
export default i18n;
