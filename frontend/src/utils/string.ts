/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

export const slugify = (str: string) => {
  return str
    .replace(/^\s+|\s+$/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "_");
};

export const getNamespace = (extensionName: string) => {
  return extensionName.replaceAll("-", "_");
};

/**
 * Checks if the string starts/ends with slashes
 */
export const isRegexString = (str: any) => {
  return typeof str === "string" && str.startsWith("/") && str.endsWith("/");
};

/**
 * Ensures value is wrapped in slashes: /value/
 */
export const formatWithSlashes = (value: string): string => {
  if (!value || typeof value !== "string") return "//";
  if (!value.startsWith("/")) value = "/" + value;
  if (!value.endsWith("/")) value = value + "/";

  return value;
};

/**
 * Extracts the inner regex from /.../
 */
export const extractRegexBody = (value: string | undefined): string => {
  if (
    value &&
    typeof value === "string" &&
    value.startsWith("/") &&
    value.endsWith("/")
  ) {
    return value.slice(1, -1);
  }

  return "";
};

/**
 * Checks if the regex pattern compiles correctly
 */
export const isRegex = (pattern: string | undefined) => {
  try {
    if (!pattern) {
      throw new Error("Pattern was not provided!");
    }

    new RegExp(pattern);

    return true;
  } catch {
    return false;
  }
};
