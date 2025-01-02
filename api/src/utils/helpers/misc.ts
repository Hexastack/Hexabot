/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

export const isEmpty = (value: string): boolean => {
  return value === undefined || value === null || value === '';
};

export const hyphenToUnderscore = (str: string) => {
  return str.replaceAll('-', '_');
};

export const kebabCase = (input: string): string => {
  return input
    .replace(/([a-z])([A-Z])/g, '$1-$2') // Add a dash between lowercase and uppercase letters
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with a dash
    .toLowerCase(); // Convert the entire string to lowercase
};

export const camelCase = (input: string): string => {
  return input
    .replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : '')) // Replace dashes, underscores, and spaces, capitalizing the following letter
    .replace(/^./, (char) => char.toLowerCase()); // Ensure the first character is lowercase
};

export const upperFirst = (input: string): string => {
  if (!input) return input; // Return as is if the input is empty
  return input.charAt(0).toUpperCase() + input.slice(1);
};
