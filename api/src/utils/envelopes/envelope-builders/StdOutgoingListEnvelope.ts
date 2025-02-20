/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  ContentElement,
  OutgoingMessageFormat,
  stdOutgoingListEnvelopeSchema,
} from '@/chat/schemas/types/message';
import { ContentOptions } from '@/chat/schemas/types/options';

export class StdOutgoingListEnvelopeBuilder {
  private format: OutgoingMessageFormat.list | OutgoingMessageFormat.carousel;

  private options: ContentOptions;

  private elements: ContentElement[] = [];

  private pagination: { total: number; skip: number; limit: number } = {
    total: 0,
    skip: 0,
    limit: 10,
  };

  constructor() {}

  setOptions(options: ContentOptions) {
    this.options = options;
    return this;
  }

  addElement(element: ContentElement) {
    this.elements.push(element);
    return this;
  }

  setElements(elements: ContentElement[]) {
    this.elements = elements;
    return this;
  }

  setFormat(
    format: OutgoingMessageFormat.list | OutgoingMessageFormat.carousel,
  ) {
    this.format = format;
    return this;
  }

  setPagination({
    total,
    skip,
    limit,
  }: {
    total: number;
    skip: number;
    limit: number;
  }) {
    this.pagination = { total, skip, limit };
    return this;
  }

  build() {
    const stdOutgoingList = new StdOutgoingList(
      this.format,
      this.options,
      this.elements,
      this.pagination,
    );
    if (this.isValid(stdOutgoingList)) {
      return stdOutgoingList;
    }

    throw new Error('Invalid stdOutgoingList shape');
  }

  private isValid(data: unknown) {
    return stdOutgoingListEnvelopeSchema.safeParse(data).success;
  }
}

export class StdOutgoingList {
  format: OutgoingMessageFormat.list | OutgoingMessageFormat.carousel;

  message: {
    options: ContentOptions;
    elements: ContentElement[];
    pagination: { total: number; skip: number; limit: number };
  };

  constructor(
    format: OutgoingMessageFormat.list | OutgoingMessageFormat.carousel,
    options: ContentOptions,
    elements: ContentElement[],
    pagination: { total: number; skip: number; limit: number },
  ) {
    this.format = format;
    this.message = {
      options,
      elements,
      pagination,
    };
  }
}
