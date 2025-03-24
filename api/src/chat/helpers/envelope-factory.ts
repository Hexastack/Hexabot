/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import Handlebars from 'handlebars';

import { I18nService } from '@/i18n/services/i18n.service';
import { getRandomElement } from '@/utils/helpers/safeRandom';

import { AttachmentPayload } from '../schemas/types/attachment';
import { Button, ButtonType } from '../schemas/types/button';
import { Context, TemplateContext } from '../schemas/types/context';
import {
  ContentElement,
  ContentPagination,
  OutgoingMessageFormat,
  StdOutgoingAttachmentEnvelope,
  StdOutgoingButtonsEnvelope,
  StdOutgoingListEnvelope,
  StdOutgoingQuickRepliesEnvelope,
  StdOutgoingSystemEnvelope,
  StdOutgoingTextEnvelope,
} from '../schemas/types/message';
import { ContentOptions } from '../schemas/types/options';
import { StdQuickReply } from '../schemas/types/quick-reply';

import { getEnvelopeBuilder } from './envelope-builder';

export class EnvelopeFactory {
  constructor(
    protected readonly context: Context,
    protected readonly settings: Settings,
    protected readonly i18n: I18nService,
  ) {}

  /**
   * Converts an old text template with single-curly placeholders, e.g. `{context.user.name}`,
   * into a Handlebars-style template, e.g. `{{context.user.name}}`.
   *
   * @param str - The template string you want to convert.
   * @returns The converted template string with Handlebars-style placeholders.
   */
  static toHandlebars(str: string) {
    // If the string already contains {{ }}, assume it's already a handlebars template.
    if (/\{\{.*\}\}/.test(str)) {
      return str;
    }

    // Otherwise, replace single curly braces { } with double curly braces {{ }}.
    return str.replaceAll(/{([^}]+)}/g, '{{$1}}');
  }

  /**
   * Compiles a handlebars template to replace tokens with their associated values in the provided text message
   *
   * `You phone number is {{context.vars.phone}}`
   * Becomes
   * `You phone number is 6354-543-534`
   *
   * @param text - Text message
   * @param context - Object holding context variables relative to the conversation (temporary)
   * @param subscriberContext - Object holding context values relative to the subscriber (permanent)
   * @param settings - Settings Object
   *
   * @returns Text message with the tokens being replaced
   */
  static compileHandlebarsTemplate(
    text: string,
    context: Context,
    settings: Settings,
  ): string {
    // Build the template context for Handlebars to match our token paths
    const templateContext: TemplateContext = {
      context: { ...context },
      contact: { ...settings.contact },
    };

    // Compile and run the Handlebars template
    const compileTemplate = Handlebars.compile(
      EnvelopeFactory.toHandlebars(text),
    );
    return compileTemplate(templateContext);
  }

  /**
   * Processes the provided text or array of texts, localizes it based on the user's language settings,
   * and then compiles it with the current context and settings using Handlebars templates.
   *
   * @param text - The text or an array of text strings to be processed.
   * @returns - The processed and localized text.
   */
  public processText(text: string | string[]): string {
    let result = Array.isArray(text) ? getRandomElement(text) : text;
    result = this.i18n.t(result, {
      lang: this.context.user.language,
      defaultValue: result,
    });
    result = EnvelopeFactory.compileHandlebarsTemplate(
      result,
      this.context,
      this.settings,
    );
    return result;
  }

  /**
   * Returns an envelope builder instance for the specified message format.
   *
   * @template F - The envelope message format extending OutgoingMessageFormat.
   * @param format - The desired envelope message format.
   * @returns A builder instance for creating envelopes of the specified format.
   */
  getBuilder<F extends OutgoingMessageFormat>(format: F) {
    return getEnvelopeBuilder<F>(format);
  }

  /**
   * Builds a text envelope by processing the provided text.
   *
   * This method processes the input text for localization and template compilation,
   * then builds a text envelope using the envelope builder.
   *
   * @param text - The text content or an array of text variants.
   * @returns A finalized text envelope object.
   */
  buildTextEnvelope(text: string | string[]): StdOutgoingTextEnvelope {
    const builder = this.getBuilder(OutgoingMessageFormat.text);
    const processedText = this.processText(text);
    return builder.setText(processedText).build();
  }

  /**
   * Builds a quick replies envelope by processing the text and quick reply items.
   *
   * Processes the input text for localization and template compilation, then appends each
   * processed quick reply (with localized title and payload) to the envelope before finalizing it.
   *
   * @param text - The text content or an array of text variants.
   * @param quickReplies - An array of quick reply objects.
   * @returns A finalized quick replies envelope object.
   */
  buildQuickRepliesEnvelope(
    text: string | string[],
    quickReplies: StdQuickReply[],
  ): StdOutgoingQuickRepliesEnvelope {
    const builder = this.getBuilder(OutgoingMessageFormat.quickReplies);
    const processedText = this.processText(text);
    const envelope = builder.setText(processedText);

    quickReplies.forEach((qr) => {
      envelope.appendToQuickReplies({
        ...qr,
        title: this.processText(qr.title),
        payload: this.processText(qr.payload),
      });
    });

    return envelope.build();
  }

  /**
   * Builds a buttons envelope by processing the text and button items.
   *
   * Processes the input text and iterates over the provided buttons.
   * For postback buttons, both the title and payload are processed; for other button types,
   * only the title is processed. Each processed button is then appended to the envelope.
   *
   * @param text - The text content or an array of text variants.
   * @param buttons - An array of button objects.
   * @returns A finalized buttons envelope object.
   */
  buildButtonsEnvelope(
    text: string | string[],
    buttons: Button[],
  ): StdOutgoingButtonsEnvelope {
    const builder = this.getBuilder(OutgoingMessageFormat.buttons);
    const processedText = this.processText(text);
    const envelope = builder.setText(processedText);

    buttons.forEach((btn) => {
      if (btn.type === ButtonType.postback) {
        envelope.appendToButtons({
          ...btn,
          title: this.processText(btn.title),
          payload: this.processText(btn.payload),
        });
      } else {
        envelope.appendToButtons({
          ...btn,
          title: this.processText(btn.title),
        });
      }
    });

    return envelope.build();
  }

  /**
   * Builds an attachment envelope with the provided attachment payload.
   *
   * Sets the attachment on the envelope and appends any quick replies after processing
   * them for localization and template compilation.
   *
   * @param attachment - The attachment payload object.
   * @param quickReplies - Optional array of quick reply objects.
   * @returns A finalized attachment envelope object.
   */
  buildAttachmentEnvelope(
    attachment: AttachmentPayload,
    quickReplies: StdQuickReply[] = [],
  ): StdOutgoingAttachmentEnvelope {
    const builder = this.getBuilder(OutgoingMessageFormat.attachment);
    const envelope = builder.setAttachment(attachment);

    quickReplies.forEach((qr) => {
      envelope.appendToQuickReplies({
        ...qr,
        title: this.processText(qr.title),
        payload: this.processText(qr.payload),
      });
    });

    return envelope.build();
  }

  /**
   * Builds a list or carousel envelope using the provided content options.
   *
   * This method builds a list envelope (applicable for both carousel and list formats)
   * by setting options, elements, and pagination details on the envelope.
   *
   * @param format - The envelope format (carousel or list).
   * @param options - Options for content presentation.
   * @param elements - An array of content elements.
   * @param pagination - Pagination details for the content.
   * @returns A finalized list envelope object.
   */
  buildListEnvelope(
    format: OutgoingMessageFormat.carousel | OutgoingMessageFormat.list,
    options: ContentOptions,
    elements: ContentElement[],
    pagination: ContentPagination,
  ): StdOutgoingListEnvelope {
    const builder = this.getBuilder(format);
    return builder
      .setOptions(options)
      .setElements(elements)
      .setPagination(pagination)
      .build();
  }

  /**
   * Builds a system envelope with the specified outcome and optional data.
   *
   * Processes the provided outcome and additional data (if any) to create a system envelope.
   * This envelope type is used for system-level messaging.
   *
   * @param outcome - The outcome message or status.
   * @param data - Optional additional data to include in the envelope.
   * @returns A finalized system envelope object.
   */
  buildSystemEnvelope(
    outcome: string | undefined,
    data?: unknown,
  ): StdOutgoingSystemEnvelope {
    const builder = this.getBuilder(OutgoingMessageFormat.system);
    return builder.setOutcome(outcome).setData(data).build();
  }
}
