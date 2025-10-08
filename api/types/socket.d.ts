/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { Session, SessionData } from 'express-session';
import 'http';

declare module 'http' {
  interface IncomingMessage {
    // The typical typing used by @types/express-session on Request
    session: Session & Partial<SessionData>;
  }
}
