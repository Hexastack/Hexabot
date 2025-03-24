/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { z } from 'zod';

import {
  OutgoingMessageFormat,
  StdOutgoingQuickRepliesEnvelope,
  stdOutgoingQuickRepliesEnvelopeSchema,
  StdOutgoingTextEnvelope,
  stdOutgoingTextEnvelopeSchema,
  stdOutgoingTextMessageSchema,
} from '../schemas/types/message';
import { QuickReplyType } from '../schemas/types/quick-reply';

import { EnvelopeBuilder, getEnvelopeBuilder } from './envelope-builder';

describe('EnvelopeBuilder', () => {
  it('should create a builder with chainable setters', () => {
    const builder = EnvelopeBuilder<StdOutgoingTextEnvelope>(
      OutgoingMessageFormat.text,
      {},
      stdOutgoingTextEnvelopeSchema,
    );

    builder.setText('Hello');

    const result = builder.build();
    expect(result).toEqual({
      format: OutgoingMessageFormat.text,
      message: {
        text: 'Hello',
      },
    });
  });

  it('should retrieve current field values when no argument is provided', () => {
    const builder = EnvelopeBuilder<StdOutgoingTextEnvelope>(
      OutgoingMessageFormat.text,
      {},
      stdOutgoingTextEnvelopeSchema,
    );

    builder.setText('Hello world');
    // Retrieve current value with no argument
    expect(builder.getText()).toBe('Hello world');
  });

  it('should append items to array fields with appendToX methods', () => {
    const builder = EnvelopeBuilder<StdOutgoingQuickRepliesEnvelope>(
      OutgoingMessageFormat.quickReplies,
      {},
      stdOutgoingQuickRepliesEnvelopeSchema,
    );

    builder.setText('Choose an option');
    builder.appendToQuickReplies({
      content_type: QuickReplyType.text,
      title: 'Yes',
      payload: 'yes',
    });
    builder.appendToQuickReplies({
      content_type: QuickReplyType.text,
      title: 'No',
      payload: 'no',
    });

    const result = builder.build();
    expect(result).toEqual({
      format: OutgoingMessageFormat.quickReplies,
      message: {
        text: 'Choose an option',
        quickReplies: [
          { content_type: QuickReplyType.text, title: 'Yes', payload: 'yes' },
          { content_type: QuickReplyType.text, title: 'No', payload: 'no' },
        ],
      },
    });
  });

  it('should validate the final envelope on build and throw on invalid data', () => {
    const builder = EnvelopeBuilder(
      OutgoingMessageFormat.text,
      {},
      stdOutgoingTextMessageSchema,
    );

    expect(() => builder.build()).toThrow(z.ZodError);
  });
});

describe('getEnvelopeBuilder', () => {
  it('should return a builder for text format that passes validation with required field', () => {
    const builder = getEnvelopeBuilder(OutgoingMessageFormat.text);
    builder.setText('Hello from text envelope!');

    const envelope = builder.build();
    expect(envelope.format).toBe(OutgoingMessageFormat.text);
    expect(envelope.message.text).toBe('Hello from text envelope!');
  });

  it('should return a builder for quickReplies format that can append items', () => {
    const builder = getEnvelopeBuilder(OutgoingMessageFormat.quickReplies);
    builder.setText('Pick an option');
    builder.appendToQuickReplies({
      content_type: QuickReplyType.text,
      title: 'Option A',
      payload: 'a',
    });

    const envelope = builder.build();
    expect(envelope.format).toBe(OutgoingMessageFormat.quickReplies);
    expect(envelope.message.text).toBe('Pick an option');
    expect(envelope.message.quickReplies?.length).toBe(1);
  });
});
