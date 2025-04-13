/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { DATE_TIME_FORMAT } from "../constants";

export const getDateTimeFormatter = (date: Date) => ({
  date,
  formatParams: {
    val: DATE_TIME_FORMAT,
  },
});

/**
 * Normalizes and formats a date using the provided locale
 *
 * @param {string} locale - The locale to use for formatting (e.g., 'en-US', 'fr-FR')
 * @param {Date | string} dateField - The date to format, either as Date object or string
 * @param {Intl.DateTimeFormatOptions} options - An object that contains one or more properties that specify comparison options
 * @returns {string | undefined} Formatted date string, or undefined if dateField is undefined
 */
export const normalizeDate = (
  locale: string = "en-US",
  dateField?: Date | string,
  options?: Intl.DateTimeFormatOptions,
) => {
  if (!dateField) return undefined;

  const date = typeof dateField === "string" ? new Date(dateField) : dateField;

  return !isNaN(date.getTime())
    ? date.toLocaleString(locale, options)
    : undefined;
};
