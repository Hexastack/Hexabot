/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
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
