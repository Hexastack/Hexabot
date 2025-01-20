/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

export const deleteCallbackHandler =
  (
    deleteOne: (id: string) => Promise<string>,
    deleteMany?: (ids: string[]) => Promise<string>,
  ) =>
  async (data: string[] = []): Promise<void> => {
    if (data.length === 1) await deleteOne(data[0]);
    else if (data.length > 1) await deleteMany?.(data);
  };
