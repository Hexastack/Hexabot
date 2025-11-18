/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

export const validateProjectName = (projectName: string) => {
  const regex = /^[a-z][a-z0-9\-]+$/;

  return regex.test(projectName);
};
