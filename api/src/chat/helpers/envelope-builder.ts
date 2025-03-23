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
  StdOutgoingAttachmentEnvelope,
  stdOutgoingAttachmentEnvelopeSchema,
  StdOutgoingButtonsEnvelope,
  stdOutgoingButtonsEnvelopeSchema,
  StdOutgoingEnvelope,
  StdOutgoingListEnvelope,
  stdOutgoingListEnvelopeSchema,
  StdOutgoingMessageEnvelope,
  StdOutgoingQuickRepliesEnvelope,
  stdOutgoingQuickRepliesEnvelopeSchema,
  StdOutgoingSystemEnvelope,
  stdOutgoingSystemEnvelopeSchema,
  StdOutgoingTextEnvelope,
  stdOutgoingTextEnvelopeSchema,
} from '../schemas/types/message';

type ArrayKeys<T> = {
  [K in keyof T]: NonNullable<T[K]> extends Array<any> ? K : never;
}[keyof T];

export type IEnvelopeBuilder<T extends StdOutgoingEnvelope> = {
  [k in keyof T['message']]-?: ((arg: T['message'][k]) => IEnvelopeBuilder<T>) &
    (() => T['message'][k]);
} & {
  [K in ArrayKeys<T['message']> as `appendTo${Capitalize<string & K>}`]: (
    item: NonNullable<T['message'][K]> extends (infer U)[] ? U : never,
  ) => IEnvelopeBuilder<T>;
} & {
  build(): T;
};

/**
 * Builds an envelope object (containing a `format` and a `message` property)
 * and returns a proxy-based builder interface with chainable setter methods.
 * It also validates the final envelope against the provided `z.ZodSchema`.
 *
 * @param format - The format of the outgoing envelope.
 * Corresponds to `format` on the generic type `T`.
 * @param template - An optional initial message template.
 * It will be merged as you set or append properties through the returned builder.
 * @param schema - A Zod schema used to validate the final envelope object.
 * @param factory - Envelope Factory which provides methods common methods.
 *
 * @returns A proxy-based builder object implementing `IEnvelopeBuilder<T>`. It provides
 * chainable setter methods for all message fields, an `appendToX` pattern for
 * array fields, and a `build()` method to finalize and validate the envelope.
 *
 * @example
 * // Build a simple text envelope:
 * const env1 = EnvelopeBuilder(OutgoingMessageFormat.text)
 *   .text('Hello')
 *   .build();
 *
 * @example
 * // Build a text envelope with quick replies:
 * const env2 = EnvelopeBuilder(OutgoingMessageFormat.quickReplies)
 *   .text('Hello')
 *   .quickReplies([])
 *   .build();
 *
 * @example
 * // Append multiple quickReplies items:
 * const env3 = EnvelopeBuilder(OutgoingMessageFormat.quickReplies)
 *   .text('Are you interested?')
 *   .appendToQuickReplies({
 *     content_type: QuickReplyType.text,
 *     title: 'Yes',
 *     payload: 'yes',
 *   })
 *   .appendToQuickReplies({
 *     content_type: QuickReplyType.text,
 *     title: 'No',
 *     payload: 'no',
 *   })
 *   .build();
 *
 * @example
 * // Build a system envelope with an outcome:
 * const env4 = EnvelopeBuilder(OutgoingMessageFormat.system)
 *   .outcome('success')
 *   .build();
 */
export function EnvelopeBuilder<T extends StdOutgoingEnvelope>(
  format: T['format'],
  template: Partial<T['message']> = {},
  schema: z.ZodSchema,
): IEnvelopeBuilder<T> {
  let built: { format: T['format']; message: Partial<T['message']> } = {
    format,
    message: template,
  };

  const builder = new Proxy(
    {},
    {
      get(target, prop) {
        if ('build' === prop) {
          // No type information - just return the object.
          return () => {
            const result = schema.parse(built);
            built = {
              format,
              message: template,
            };
            return result;
          };
        }

        if (typeof prop === 'string' && prop.startsWith('appendTo')) {
          // e.g. "appendToButtons" => "Buttons"
          const rawKey = prop.replace(/^appendTo/, '');
          // e.g. "Buttons" -> "buttons"
          const messageKey = rawKey.charAt(0).toLowerCase() + rawKey.slice(1);

          return (item: unknown) => {
            // Initialize the array if needed
            if (!Array.isArray(built.message[messageKey])) {
              built.message[messageKey] = [];
            }
            (built.message[messageKey] as unknown[]).push(item);
            return builder;
          };
        }

        return (...args: unknown[]): unknown => {
          // If no arguments passed return current value.
          if (0 === args.length) {
            return built.message[prop.toString()];
          }

          const value = args[0];

          built.message[prop.toString()] = value;
          return builder;
        };
      },
    },
  );

  return builder as IEnvelopeBuilder<T>;
}

type EnvelopeTypeByFormat<F extends OutgoingMessageFormat> =
  F extends OutgoingMessageFormat.text
    ? StdOutgoingTextEnvelope
    : F extends OutgoingMessageFormat.quickReplies
      ? StdOutgoingQuickRepliesEnvelope
      : F extends OutgoingMessageFormat.buttons
        ? StdOutgoingButtonsEnvelope
        : F extends OutgoingMessageFormat.attachment
          ? StdOutgoingAttachmentEnvelope
          : F extends OutgoingMessageFormat.carousel
            ? StdOutgoingListEnvelope
            : F extends OutgoingMessageFormat.list
              ? StdOutgoingListEnvelope
              : F extends OutgoingMessageFormat.system
                ? StdOutgoingSystemEnvelope
                : StdOutgoingMessageEnvelope;

const ENVELOP_SCHEMAS_BY_FORMAT = {
  [OutgoingMessageFormat.text]: stdOutgoingTextEnvelopeSchema,
  [OutgoingMessageFormat.quickReplies]: stdOutgoingQuickRepliesEnvelopeSchema,
  [OutgoingMessageFormat.buttons]: stdOutgoingButtonsEnvelopeSchema,
  [OutgoingMessageFormat.attachment]: stdOutgoingAttachmentEnvelopeSchema,
  [OutgoingMessageFormat.carousel]: stdOutgoingListEnvelopeSchema,
  [OutgoingMessageFormat.list]: stdOutgoingListEnvelopeSchema,
  [OutgoingMessageFormat.system]: stdOutgoingSystemEnvelopeSchema,
};

export const getEnvelopeBuilder = <F extends OutgoingMessageFormat>(
  format: F,
) => {
  return EnvelopeBuilder<EnvelopeTypeByFormat<F>>(
    format,
    {},
    ENVELOP_SCHEMAS_BY_FORMAT[format],
  );
};
