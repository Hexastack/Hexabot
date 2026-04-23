/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  OutgoingMessageType,
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
} from '@hexabot-ai/types';
import { z } from 'zod';

type ArrayKeys<T> = {
  [K in keyof T]: NonNullable<T[K]> extends Array<any> ? K : never;
}[keyof T];

export type IEnvelopeBuilder<T extends StdOutgoingEnvelope> = {
  [K in keyof T['data'] as `set${Capitalize<string & K>}`]-?: (
    arg: T['data'][K],
  ) => IEnvelopeBuilder<T>;
} & {
  [K in keyof T['data'] as `get${Capitalize<string & K>}`]-?: () => T['data'][K];
} & {
  [K in ArrayKeys<T['data']> as `appendTo${Capitalize<string & K>}`]: (
    item: NonNullable<T['data'][K]> extends (infer U)[] ? U : never,
  ) => IEnvelopeBuilder<T>;
} & {
  build(): T;
};

/**
 * Extracts and transforms a property name into a standardized attribute name.
 *
 * @param prop - The property name from which to derive the attribute name.
 * @param prefix - A regular expression that matches the prefix to remove from the property.
 * @returns The transformed attribute name with its first character in lowercase.
 */
function getAttributeNameFromProp(prop: string, prefix: RegExp) {
  // e.g. "appendToButtons" => "Buttons"
  const rawKey = prop.toString().replace(prefix, '');
  // e.g. "Buttons" -> "buttons"
  const dataKey = rawKey.charAt(0).toLowerCase() + rawKey.slice(1);

  return dataKey;
}

/**
 * Builds an envelope object (containing a `type` and a `data` property)
 * and returns a proxy-based builder interface with chainable setter methods.
 * It also validates the final envelope against the provided `z.ZodSchema`.
 *
 * @param type - The type of the outgoing envelope.
 * Corresponds to `type` on the generic type `T`.
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
 * const env1 = EnvelopeBuilder(OutgoingMessageType.text)
 *   .setText('Hello')
 *   .build();
 *
 * @example
 * // Build a text envelope with quick replies:
 * const env2 = EnvelopeBuilder(OutgoingMessageType.quickReply)
 *   .setText('Hello')
 *   .setQuickReplies([])
 *   .build();
 *
 * @example
 * // Append multiple quickReplies items:
 * const env3 = EnvelopeBuilder(OutgoingMessageType.quickReply)
 *   .setText('Are you interested?')
 *   .appendToQuickReplies({
 *     title: 'Yes',
 *     payload: 'yes',
 *   })
 *   .appendToQuickReplies({
 *     title: 'No',
 *     payload: 'no',
 *   })
 *   .build();
 *
 * @example
 * // Build a system envelope with an outcome:
 * const env4 = EnvelopeBuilder(OutgoingMessageType.system)
 *   .setOutcome('success')
 *   .build();
 */
export function EnvelopeBuilder<T extends StdOutgoingEnvelope>(
  type: T['type'],
  template: Partial<T['data']> = {},
  schema: z.ZodType,
): IEnvelopeBuilder<T> {
  let built: { type: T['type']; data: Partial<T['data']> } = {
    type,
    data: template,
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
              type,
              data: template,
            };

            return result;
          };
        }

        if (typeof prop === 'string' && prop.startsWith('appendTo')) {
          const dataKey = getAttributeNameFromProp(prop, /^appendTo/);

          return (item: unknown) => {
            // Initialize the array if needed
            if (!Array.isArray(built.data[dataKey])) {
              built.data[dataKey] = [];
            }
            (built.data[dataKey] as unknown[]).push(item);

            return builder;
          };
        }

        return (...args: unknown[]): unknown => {
          // If no arguments passed return current value.
          if (0 === args.length) {
            const dataKey = getAttributeNameFromProp(prop.toString(), /^get/);

            return built.data[dataKey];
          }

          const value = args[0];
          const dataKey = getAttributeNameFromProp(prop.toString(), /^set/);
          built.data[dataKey] = value;

          return builder;
        };
      },
    },
  );

  return builder as IEnvelopeBuilder<T>;
}

type EnvelopeTypeByType<T extends OutgoingMessageType> =
  T extends OutgoingMessageType.text
    ? StdOutgoingTextEnvelope
    : T extends OutgoingMessageType.quickReply
      ? StdOutgoingQuickRepliesEnvelope
      : T extends OutgoingMessageType.buttons
        ? StdOutgoingButtonsEnvelope
        : T extends OutgoingMessageType.attachment
          ? StdOutgoingAttachmentEnvelope
          : T extends OutgoingMessageType.carousel
            ? StdOutgoingListEnvelope
            : T extends OutgoingMessageType.list
              ? StdOutgoingListEnvelope
              : T extends OutgoingMessageType.system
                ? StdOutgoingSystemEnvelope
                : StdOutgoingMessageEnvelope;

const ENVELOPE_SCHEMAS_BY_TYPE = {
  [OutgoingMessageType.text]: stdOutgoingTextEnvelopeSchema,
  [OutgoingMessageType.quickReply]: stdOutgoingQuickRepliesEnvelopeSchema,
  [OutgoingMessageType.buttons]: stdOutgoingButtonsEnvelopeSchema,
  [OutgoingMessageType.attachment]: stdOutgoingAttachmentEnvelopeSchema,
  [OutgoingMessageType.carousel]: stdOutgoingListEnvelopeSchema,
  [OutgoingMessageType.list]: stdOutgoingListEnvelopeSchema,
  [OutgoingMessageType.system]: stdOutgoingSystemEnvelopeSchema,
};

export const getEnvelopeBuilder = <F extends OutgoingMessageType>(type: F) => {
  return EnvelopeBuilder<EnvelopeTypeByType<F>>(
    type,
    {},
    ENVELOPE_SCHEMAS_BY_TYPE[type],
  );
};
