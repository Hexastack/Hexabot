/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ContentFieldType } from "@/types/content-type.types";

export const FIELDS_FORM_NAME = "fields";
export const READ_ONLY_FIELDS = ["Title", "Status"] as const;
export const FIELDS_FORM_DEFAULT_VALUES = [
  {
    label: "Title",
    name: "title",
    type: ContentFieldType.TEXT,
  },
  {
    label: "Status",
    name: "status",
    type: ContentFieldType.CHECKBOX,
  },
];
