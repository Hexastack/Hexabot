/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { AttachmentPayload, FileType } from '../schemas/types/attachment';
import { Button, ButtonType } from '../schemas/types/button';
import { Context } from '../schemas/types/context';
import {
  ContentElement,
  ContentPagination,
  OutgoingMessageFormat,
} from '../schemas/types/message';
import { ContentOptions } from '../schemas/types/options';
import { QuickReplyType, StdQuickReply } from '../schemas/types/quick-reply';

import { EnvelopeFactory } from './envelope-factory';

// Mock getRandomElement to produce a predictable result in tests.
jest.mock('@/utils/helpers/safeRandom', () => ({
  getRandomElement: (array) => (Array.isArray(array) ? array[0] : array),
}));

// Set up a dummy global Handlebars so that our template compilation works.
// This simple implementation replaces tokens of the form {{a.b.c}} by looking up the path.
(global as any).Handlebars = {
  compile: (template: string) => (context: any) =>
    template.replace(/\{\{([^}]+)\}\}/g, (_, token: string) => {
      const parts = token.trim().split('.');
      let value = context;
      for (const part of parts) {
        value = value[part];
      }
      return value;
    }),
};

describe('EnvelopeFactory', () => {
  let factory: EnvelopeFactory;
  let context: Context;
  let settings: Settings;
  let i18n: { t: jest.Mock };

  beforeEach(async () => {
    context = {
      user: { language: 'en', first_name: 'John', last_name: 'Doe', id: '123' },
      vars: { phone: '123-456-7890' },
    } as unknown as Context;
    settings = {
      contact: {
        company_name: 'John Inc.',
        company_email: 'contact@john-inc.com',
      },
    } as Settings;
    // For testing, i18n.t simply returns the provided text unchanged.
    i18n = { t: jest.fn((text: string) => text) };
    factory = new EnvelopeFactory(context, settings, i18n as any);
  });

  describe('toHandlebars (static)', () => {
    it('should convert single curly braces to double curly braces when no existing {{ }} are present', () => {
      const input =
        'Hello {context.user.name}, your phone is {context.vars.phone}';
      // Access the private method using bracket notation
      const result = EnvelopeFactory.toHandlebars(input);
      expect(result).toBe(
        'Hello {{context.user.name}}, your phone is {{context.vars.phone}}',
      );
    });

    it('should leave strings that already contain double curly braces unchanged', () => {
      const input =
        'Hello {{context.user.name}}, your phone is {{context.vars.phone}}';
      const result = EnvelopeFactory.toHandlebars(input);
      expect(result).toBe(input);
    });

    it('should handle strings with no braces at all', () => {
      const input = 'Hello world, no braces here';
      const result = EnvelopeFactory.toHandlebars(input);
      // Should be unchanged since there are no placeholders
      expect(result).toBe(input);
    });

    it('should handle multiple single placeholders correctly', () => {
      const input = '{one} {two} {three}';
      const result = EnvelopeFactory.toHandlebars(input);
      expect(result).toBe('{{one}} {{two}} {{three}}');
    });
  });

  describe('compileHandlebarsTemplate', () => {
    it('should replace tokens with context variables correctly', () => {
      const text =
        'Hello {{context.user.first_name}} {{context.user.last_name}}, your phone is {{context.vars.phone}}';

      const result = EnvelopeFactory.compileHandlebarsTemplate(
        text,
        context,
        settings,
      );
      // Expect that single curly braces got turned into Handlebars placeholders
      // and then replaced with actual values from the merged context
      expect(result).toBe('Hello John Doe, your phone is 123-456-7890');
    });

    it('should merge subscriberContext.vars and context.vars correctly', () => {
      const text =
        'Subscriber var: {context.vars.subscriberVar}, Context var: {context.vars.contextVar}';
      const context = {
        user: {},
        vars: {
          contextVar: 'ContextValue',
          subscriberVar: 'SubscriberValue',
        },
      } as unknown as Context;
      const settings = {
        contact: {},
      } as unknown as Settings;

      const result = EnvelopeFactory.compileHandlebarsTemplate(
        text,
        context,
        settings,
      );
      expect(result).toBe(
        'Subscriber var: SubscriberValue, Context var: ContextValue',
      );
    });

    it('should use contact from settings if provided', () => {
      const text = 'You can reach us at {{contact.company_email}}';
      const result = EnvelopeFactory.compileHandlebarsTemplate(
        text,
        context,
        settings,
      );
      expect(result).toBe('You can reach us at contact@john-inc.com');
    });

    it('should handle no placeholders gracefully', () => {
      const text = 'No placeholders here.';
      const result = EnvelopeFactory.compileHandlebarsTemplate(
        text,
        context,
        settings,
      );
      expect(result).toBe('No placeholders here.');
    });
  });

  describe('processText', () => {
    it('should process text when a string is provided', () => {
      const input = 'Hello {{context.user.first_name}}';
      const result = factory.processText(input);
      expect(result).toBe('Hello John');
      expect(i18n.t).toHaveBeenCalledWith(input, {
        lang: context.user.language,
        defaultValue: input,
      });
    });

    it('should process text when an array is provided (using the first element)', () => {
      const texts = ['Option1 {{context.user.first_name}}', 'Option2'];
      const result = factory.processText(texts);
      expect(result).toBe('Option1 John');
    });
  });

  describe('buildTextEnvelope', () => {
    it('should build a text envelope with processed text', () => {
      const input = 'Hello {{context.user.first_name}}';
      const envelope = factory.buildTextEnvelope(input);
      expect(envelope.format).toBe(OutgoingMessageFormat.text);
      expect(envelope.message.text).toBe('Hello John');
    });
  });

  describe('buildQuickRepliesEnvelope', () => {
    it('should build a quick replies envelope with processed text and quick replies', () => {
      const input = "Choose {{context.user.first_name}}'s option";
      const quickReplies = [
        {
          content_type: QuickReplyType.text,
          title: 'Yes {{contact.company_name}}',
          payload: 'do_{{context.user.id}}',
        },
        {
          content_type: QuickReplyType.text,
          title: 'No {{contact.company_name}}',
          payload: 'dont_{{context.user.id}}',
        },
      ] as StdQuickReply[];
      const envelope = factory.buildQuickRepliesEnvelope(input, quickReplies);
      expect(envelope.format).toBe(OutgoingMessageFormat.quickReplies);
      expect(envelope.message.text).toBe("Choose John's option");
      expect(envelope.message.quickReplies).toHaveLength(2);
      expect(envelope.message.quickReplies[0].title).toBe('Yes John Inc.');
      expect(envelope.message.quickReplies[0].payload).toBe('do_123');
      expect(envelope.message.quickReplies[1].title).toBe('No John Inc.');
      expect(envelope.message.quickReplies[1].payload).toBe('dont_123');
    });
  });

  describe('buildButtonsEnvelope', () => {
    it('should build a buttons envelope with processed text and buttons', () => {
      const input = 'Press a button';
      const buttons: Button[] = [
        {
          type: ButtonType.postback,
          title: 'Click {{contact.company_name}}',
          payload: 'btn_{context.user.id}',
        },
        {
          type: ButtonType.web_url,
          title: 'Visit {{contact.company_name}}',
          url: 'https://example.com',
        },
      ];
      const envelope = factory.buildButtonsEnvelope(input, buttons);
      expect(envelope.format).toBe(OutgoingMessageFormat.buttons);
      expect(envelope.message.text).toBe('Press a button');
      expect(envelope.message.buttons).toHaveLength(2);
      // For a postback button, both title and payload are processed.
      expect(envelope.message.buttons[0].title).toBe('Click John Inc.');
      // @ts-expect-error part of the test
      expect(envelope.message.buttons[0].payload).toBe('btn_123');
      // For a non-postback button, only the title is processed.
      expect(envelope.message.buttons[1].title).toBe('Visit John Inc.');
      // @ts-expect-error part of the test
      expect(envelope.message.buttons[1].url).toBe('https://example.com');
    });
  });

  describe('buildAttachmentEnvelope', () => {
    it('should build an attachment envelope with the provided attachment and processed quick replies', () => {
      const attachment = {
        type: FileType.image,
        payload: {
          url: 'https://example.com/image.png',
        },
      } as AttachmentPayload;
      const quickReplies = [
        {
          content_type: QuickReplyType.text,
          title: 'Yes {contact.company_name}',
          payload: 'do_{context.user.id}',
        },
      ] as StdQuickReply[];
      const envelope = factory.buildAttachmentEnvelope(
        attachment,
        quickReplies,
      );
      expect(envelope.format).toBe(OutgoingMessageFormat.attachment);
      expect(envelope.message.attachment).toEqual(attachment);
      expect(envelope.message.quickReplies).toHaveLength(1);
      expect(envelope.message.quickReplies?.[0].title).toBe('Yes John Inc.');
      expect(envelope.message.quickReplies?.[0].payload).toBe('do_123');
    });
  });

  describe('buildListEnvelope', () => {
    it('should build a list (or carousel) envelope with options, elements and pagination', () => {
      const elements = [
        { id: '1', title: 'Element 1' },
        { id: '2', title: 'Element 2' },
        { id: '3', title: 'Element 3' },
      ] as ContentElement[];
      // Test both carousel and list formats.
      [OutgoingMessageFormat.carousel, OutgoingMessageFormat.list].forEach(
        (format) => {
          const options = {
            buttons: [],
            display: format,
            limit: 3,
            fields: {
              title: 'title',
              subtitle: '',
              image_url: '',
            },
          } as unknown as ContentOptions;
          const pagination = {
            total: 3,
            skip: 0,
            limit: 3,
          } as ContentPagination;

          const envelope = factory.buildListEnvelope(
            format as
              | OutgoingMessageFormat.carousel
              | OutgoingMessageFormat.list,
            options,
            elements,
            pagination,
          );
          expect(envelope.format).toBe(format);
          expect(envelope.message.options).toEqual(options);
          expect(envelope.message.elements).toEqual(elements);
          expect(envelope.message.pagination).toEqual(pagination);
        },
      );
    });
  });

  describe('buildSystemEnvelope', () => {
    it('should build a system envelope with outcome and data', () => {
      const outcome = 'success';
      const data = { key: 'value' };
      const envelope = factory.buildSystemEnvelope(outcome, data);
      expect(envelope.format).toBe(OutgoingMessageFormat.system);
      expect(envelope.message.outcome).toBe(outcome);
      expect(envelope.message.data).toEqual(data);
    });
  });
});
