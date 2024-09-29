/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

import { Block } from '@/chat/schemas/block.schema';
import { Context } from '@/chat/schemas/types/context';
import {
  OutgoingMessageFormat,
  StdOutgoingTextEnvelope,
} from '@/chat/schemas/types/message';
import { ContentService } from '@/cms/services/content.service';
import { LoggerService } from '@/logger/logger.service';
import { BaseBlockPlugin } from '@/plugins/base-block-plugin';
import { PluginService } from '@/plugins/plugins.service';
import { SettingType } from '@/setting/schemas/types';

@Injectable()
export class ChatGptRagPlugin extends BaseBlockPlugin {
  private openai: OpenAI;

  constructor(
    pluginService: PluginService,
    private logger: LoggerService,
    private contentService: ContentService,
  ) {
    super('chatgpt-rag', pluginService);

    this.settings = [
      {
        id: 'token',
        label: 'Token',
        group: 'default',
        type: SettingType.secret,
        value: '',
      },
      {
        id: 'model',
        label: 'Model',
        group: 'default',
        type: SettingType.text,
        value: 'gpt-4o-mini',
      },
      {
        id: 'context',
        label: 'Context',
        group: 'default',
        type: SettingType.textarea,
        value: `You are an AI Chatbot that works for Hexastack, This is their description : Whether it concerns IT staff augmentation, web development or software consulting, we believe that each development project is a human adventure above all.
  That’s why at Hexastack, soft skills and mindset are as important as technical skills to meet success.
  We ensure that everyone in our team is mastering the technologies as well as the soft skills needed to rapidly connect and efficiently cooperate with your team in order to get things done in the smoothest possible way.
  `,
      },
      {
        id: 'instructions',
        label: 'Instructions',
        group: 'default',
        type: SettingType.textarea,
        value: `answer the user QUESTION using the DOCUMENTS text above
          Keep your answer ground in the facts of the DOCUMENT.
          If the DOCUMENT doesn’t contain the facts to answer the QUESTION, apologize and try to give an answer that promotes the company and it's values
          DO NOT SAY ANY THING ABOUT THESE DOCUMENTS, or their EXISTANCE`,
      },
    ];

    this.title = 'ChatGPT RAG';

    this.template = { name: 'ChatGPT RAG Plugin' };

    this.effects = {
      onStoreContextData: () => {},
    };
  }

  async process(block: Block, context: Context, _convId: string) {
    const RAG = await this.contentService.textSearch(context.text);
    const args = block.message['args'];
    const client = this.getInstance(args.token);
    const completion = await client.chat.completions.create({
      model: args['model'],
      messages: [
        {
          role: 'system',
          content: `CONTEXT: ${args.context}
          DOCUMENTS: \n${RAG.reduce(
            (prev, curr, index) =>
              `${prev}\n\tDOCUMENT ${index} \n\t\tTitle:${curr.title}\n\t\tData:${curr.rag}`,
            '',
          )}\nINSTRUCTIONS: 
          ${args.instructions}
        `,
        },
        { role: 'user', content: 'QUESTION: \n' + context.text },
      ],
      temperature: 0.8,
    });

    const envelope: StdOutgoingTextEnvelope = {
      format: OutgoingMessageFormat.text,
      message: {
        text: completion.choices[0].message.content,
      },
    };
    return envelope;
  }

  private getInstance(token: string) {
    if (this.openai) {
      return this.openai;
    }

    try {
      this.openai = new OpenAI({
        apiKey: token,
      });
      return this.openai;
    } catch (err) {
      this.logger.warn('RAG: Unable to instanciate OpenAI', err);
    }
  }
}
