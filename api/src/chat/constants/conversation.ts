/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Subscriber } from '../schemas/subscriber.schema';
import { Context } from '../schemas/types/context';

export function getDefaultConversationContext(): Context {
  return {
    vars: {}, // Used for capturing vars from user entries
    user: {
      first_name: '',
      last_name: '',
      // @TODO: Typing is not correct
    } as Subscriber,
    user_location: {
      // Used for capturing geolocation from QR
      lat: 0.0,
      lon: 0.0,
    },
    skip: {}, // Used for list pagination
    attempt: 0, // Used to track fallback max attempts
  };
}
