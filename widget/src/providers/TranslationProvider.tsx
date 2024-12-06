/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import React, { createContext, useContext, useState, ReactNode } from "react";

import { translations } from "../translations";

import { useConfig } from "./ConfigProvider";

type Language = keyof typeof translations;

interface TranslationContextProps {
  translations: typeof translations;
  language: Language;
  setLanguage: (language: Language) => void;
}

interface TranslationProviderProps {
  children: ReactNode;
}

const TranslationContext = createContext<TranslationContextProps | undefined>(
  undefined,
);

export const TranslationProvider: React.FC<TranslationProviderProps> = ({
  children,
}) => {
  const config = useConfig();
  const initialLanguage = config.language;
  const isValidLanguage = (lang: string): lang is Language =>
    lang in translations;
  const [language, setLanguage] = useState<Language>(
    isValidLanguage(initialLanguage) ? initialLanguage : "en",
  );

  return (
    <TranslationContext.Provider
      value={{ translations, language, setLanguage }}
    >
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslations = () => {
  const context = useContext(TranslationContext);

  if (!context) {
    throw new Error(
      "useTranslationContext must be used within a TranslationProvider",
    );
  }

  return context;
};
