/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isToday from "dayjs/plugin/isToday";
import localizedFormat from "dayjs/plugin/localizedFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import weekday from "dayjs/plugin/weekday";

import { DATE_TIME_FORMAT } from "../constants";

dayjs.extend(relativeTime);
dayjs.extend(isToday);
dayjs.extend(isSameOrAfter);
dayjs.extend(weekday);
dayjs.extend(localizedFormat);
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
/**
 * Formats a date based on time difference and locale.
 * @param date - The date to format
 * @param locale - A valid dayjs locale code (e.g., 'en', 'fr', 'am')
 */
export function formatSmartDate(date: Date, locale: string = "en"): string {
  const now = dayjs();
  const inputDate = dayjs(date).locale(locale);
  const diffInMinutes = now.diff(inputDate, "minute");

  if (diffInMinutes < 1) {
    return inputDate.locale(locale).fromNow(); // "a few seconds ago"
  } else if (diffInMinutes < 60) {
    return inputDate.fromNow(); // e.g. "5 minutes ago"
  } else if (inputDate.isToday()) {
    return inputDate.format("LT"); // e.g. "3:25 PM" or localized version
  } else if (inputDate.isSameOrAfter(dayjs().weekday(0))) {
    return inputDate.format("ddd LT"); // e.g. "Tue 3:25 PM"
  } else {
    return inputDate.format("ll LT"); // e.g. "Jul 21, 2025 3:25 PM"
  }
}
