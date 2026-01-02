/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { AttachmentPayload, FileType } from '../types/attachment';
import { Button, ButtonType } from '../types/button';
import { ChatContext } from '../types/chat-context';
import {
  ContentElement,
  ContentPagination,
  OutgoingMessageFormat,
} from '../types/message';
import { ContentOptions } from '../types/options';
import { QuickReplyType, StdQuickReply } from '../types/quick-reply';

import { EnvelopeFactory } from './envelope-factory';

// Mock getRandomElement to produce a predictable result in tests.
jest.mock('@/utils/helpers/safeRandom', () => ({
  getRandomElement: (array) => (Array.isArray(array) ? array[0] : array),
}));

describe('EnvelopeFactory', () => {
  let factory: EnvelopeFactory;
  let context: ChatContext;
  let settings: Settings;
  let i18n: { t: jest.Mock };

  beforeEach(async () => {
    context = {
      user: { language: 'en', first_name: 'John', last_name: 'Doe', id: '123' },
      vars: { phone: '123-456-7890' },
    } as unknown as ChatContext;
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

  describe('processText', () => {
    it('should localize text when a string is provided without compiling templates', () => {
      const input = 'Hello {{context.user.first_name}}';
      const result = factory.processText(input);
      expect(result).toBe('Hello {{context.user.first_name}}');
      expect(i18n.t).toHaveBeenCalledWith(input, {
        lang: context.user.language,
        defaultValue: input,
      });
    });

    it('should process text when an array is provided (using the first element)', () => {
      const texts = ['First option', 'Second option'];
      const result = factory.processText(texts);
      expect(result).toBe('First option');
    });
  });

  describe('buildTextEnvelope', () => {
    it('should build a text envelope with processed text', () => {
      const input = 'Hello there';
      const envelope = factory.buildTextEnvelope(input);
      expect(envelope.format).toBe(OutgoingMessageFormat.text);
      expect(envelope.message.text).toBe('Hello there');
    });
  });

  describe('buildQuickRepliesEnvelope', () => {
    it('should build a quick replies envelope with processed text and quick replies', () => {
      const input = 'Choose an option';
      const quickReplies = [
        {
          content_type: QuickReplyType.text,
          title: 'Yes',
          payload: 'do_123',
        },
        {
          content_type: QuickReplyType.text,
          title: 'No',
          payload: 'dont_123',
        },
      ] as StdQuickReply[];
      const envelope = factory.buildQuickRepliesEnvelope(input, quickReplies);
      expect(envelope.format).toBe(OutgoingMessageFormat.quickReplies);
      expect(envelope.message.text).toBe('Choose an option');
      expect(envelope.message.quickReplies).toHaveLength(2);
      expect(envelope.message.quickReplies[0].title).toBe('Yes');
      expect(envelope.message.quickReplies[0].payload).toBe('do_123');
      expect(envelope.message.quickReplies[1].title).toBe('No');
      expect(envelope.message.quickReplies[1].payload).toBe('dont_123');
    });
  });

  describe('buildButtonsEnvelope', () => {
    it('should build a buttons envelope with processed text and buttons', () => {
      const input = 'Press a button';
      const buttons: Button[] = [
        {
          type: ButtonType.postback,
          title: 'Click company',
          payload: 'btn_123',
        },
        {
          type: ButtonType.web_url,
          title: 'Visit company',
          url: 'https://example.com',
        },
      ];
      const envelope = factory.buildButtonsEnvelope(input, buttons);
      expect(envelope.format).toBe(OutgoingMessageFormat.buttons);
      expect(envelope.message.text).toBe('Press a button');
      expect(envelope.message.buttons).toHaveLength(2);
      // For a postback button, both title and payload are processed.
      expect(envelope.message.buttons[0].title).toBe('Click company');
      // @ts-expect-error part of the test
      expect(envelope.message.buttons[0].payload).toBe('btn_123');
      // For a non-postback button, only the title is processed.
      expect(envelope.message.buttons[1].title).toBe('Visit company');
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
          title: 'Yes company',
          payload: 'do_123',
        },
      ] as StdQuickReply[];
      const envelope = factory.buildAttachmentEnvelope(
        attachment,
        quickReplies,
      );
      expect(envelope.format).toBe(OutgoingMessageFormat.attachment);
      expect(envelope.message.attachment).toEqual(attachment);
      expect(envelope.message.quickReplies).toHaveLength(1);
      expect(envelope.message.quickReplies?.[0].title).toBe('Yes company');
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
