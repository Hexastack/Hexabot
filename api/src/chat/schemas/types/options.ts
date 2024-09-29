/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Button } from './button';
import { OutgoingMessageFormat } from './message';

export interface ContentOptions {
  display: OutgoingMessageFormat.list | OutgoingMessageFormat.carousel;
  fields: {
    title: string;
    subtitle: string | null;
    image_url: string | null;
    url?: string;
    action_title?: string;
    action_payload?: string;
  };
  buttons: Button[];
  limit: number;
  query?: any; // Waterline model criteria
  entity?: string | number; // ContentTypeID
  top_element_style?: 'large' | 'compact';
}

export interface BlockOptions {
  typing?: number;
  // In case of carousel/list message
  content?: ContentOptions;
  // Only if the block has next blocks
  fallback?: {
    active: boolean;
    message: string[];
    max_attempts: number;
  };
  assignTo?: string;
  // plugins effects
  effects?: string[];
}
