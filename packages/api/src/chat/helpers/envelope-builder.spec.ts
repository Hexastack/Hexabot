/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  OutgoingMessageType,
  StdOutgoingQuickRepliesEnvelope,
  stdOutgoingQuickRepliesEnvelopeSchema,
  StdOutgoingTextEnvelope,
  stdOutgoingTextEnvelopeSchema,
  stdOutgoingTextMessageSchema,
} from '@hexabot-ai/types';
import { z } from 'zod';

import { EnvelopeBuilder, getEnvelopeBuilder } from './envelope-builder';

describe('EnvelopeBuilder', () => {
  it('should create a builder with chainable setters', () => {
    const builder = EnvelopeBuilder<StdOutgoingTextEnvelope>(
      OutgoingMessageType.text,
      {},
      stdOutgoingTextEnvelopeSchema,
    );

    builder.setText('Hello');

    const result = builder.build();
    expect(result).toEqual({
      type: OutgoingMessageType.text,
      data: {
        text: 'Hello',
      },
    });
  });

  it('should retrieve current field values when no argument is provided', () => {
    const builder = EnvelopeBuilder<StdOutgoingTextEnvelope>(
      OutgoingMessageType.text,
      {},
      stdOutgoingTextEnvelopeSchema,
    );

    builder.setText('Hello world');
    // Retrieve current value with no argument
    expect(builder.getText()).toBe('Hello world');
  });

  it('should append items to array fields with appendToX methods', () => {
    const builder = EnvelopeBuilder<StdOutgoingQuickRepliesEnvelope>(
      OutgoingMessageType.quickReply,
      {},
      stdOutgoingQuickRepliesEnvelopeSchema,
    );

    builder.setText('Choose an option');
    builder.appendToQuickReplies({
      title: 'Yes',
      payload: 'yes',
    });
    builder.appendToQuickReplies({
      title: 'No',
      payload: 'no',
    });

    const result = builder.build();
    expect(result).toEqual({
      type: OutgoingMessageType.quickReply,
      data: {
        text: 'Choose an option',
        quickReplies: [
          { title: 'Yes', payload: 'yes' },
          { title: 'No', payload: 'no' },
        ],
      },
    });
  });

  it('should validate the final envelope on build and throw on invalid data', () => {
    const builder = EnvelopeBuilder(
      OutgoingMessageType.text,
      {},
      stdOutgoingTextMessageSchema,
    );

    expect(() => builder.build()).toThrow(z.ZodError);
  });
});

describe('getEnvelopeBuilder', () => {
  it('should return a builder for text format that passes validation with required field', () => {
    const builder = getEnvelopeBuilder(OutgoingMessageType.text);
    builder.setText('Hello from text envelope!');

    const envelope = builder.build();
    expect(envelope.type).toBe(OutgoingMessageType.text);
    expect(envelope.data.text).toBe('Hello from text envelope!');
  });

  it('should return a builder for quickReplies format that can append items', () => {
    const builder = getEnvelopeBuilder(OutgoingMessageType.quickReply);
    builder.setText('Pick an option');
    builder.appendToQuickReplies({
      title: 'Option A',
      payload: 'a',
    });

    const envelope = builder.build();
    expect(envelope.type).toBe(OutgoingMessageType.quickReply);
    expect(envelope.data.text).toBe('Pick an option');
    expect(envelope.data.quickReplies.length).toBe(1);
  });
});
