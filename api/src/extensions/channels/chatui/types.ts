/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Web } from '@/extensions/channels/web/types';

export namespace ChatUiWeb {
  export enum RequestType {
    sign_up = 'sign_up',
    sign_in = 'sign_in',
  }

  export type SignUpRequest = {
    type: RequestType.sign_up;
    data: {
      email: string;
      password: string;
    };
  };

  export type SignInRequest = {
    type: RequestType.sign_in;
    data: {
      email: string;
      password: string;
    };
  };

  export type Request = SignUpRequest | SignInRequest;

  export type Event = Web.IncomingMessage | Web.StatusEvent | Request;
}
