/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function idPlugin(schema, _options) {
  schema.set('toJSON', {
    transform: (doc, ret) => {
      ret.id = ret._id; // Map _id to id
      delete ret._id; // Remove _id
      delete ret.__v; // Remove version key
      return ret;
    },
    virtuals: true,
  });
}
