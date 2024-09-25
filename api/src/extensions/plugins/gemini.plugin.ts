import { GoogleGenerativeAI } from '@google/generative-ai'; // Importing Google Generative AI
import { Injectable } from '@nestjs/common';

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
export class GeminiPlugin extends BaseBlockPlugin {
  private generativeAI: GoogleGenerativeAI;

  constructor(
    pluginService: PluginService,
    private logger: LoggerService,
    private contentService: ContentService,
  ) {
    super('gemini-plugin', pluginService);

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
        value: 'gemini-1.5-flash',
      },
      {
        id: 'temperature',
        label: 'Temperature',
        group: 'default',
        type: SettingType.number,
        value: 0.8,
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
          If the DOCUMENT doesn’t contain the facts to answer the QUESTION, apologize and try to give an answer that promotes the company and its values
          DO NOT SAY ANYTHING ABOUT THESE DOCUMENTS, or their EXISTENCE`,
      },
    ];

    this.title = 'Gemini Plugin';

    this.template = { name: 'Gemini Plugin' };

    this.effects = {
      onStoreContextData: () => {},
    };
  }

  async process(block: Block, context: Context, _convId: string) {
    const RAG = await this.contentService.textSearch(context.text);
    const args = block.message['args'];
    const client = this.getInstance(args.token);
    const model = client.getGenerativeModel({
      model: args['model'],
      generationConfig: {
        /* 
        =====================================================================
        Check the documentation for more details on the generation config 
        https://ai.google.dev/api/generate-content#v1beta.GenerationConfig 
        =====================================================================
        */

        // controls the randomness of the output. Use higher values for more creative responses,
        // and lower values for more deterministic responses. Values can range from [0.0, 2.0].
        temperature: args['temperature'],
      },
    });

    const prompt = `CONTEXT: ${args.context}
      DOCUMENTS: \n${RAG.reduce(
        (prev, curr, index) =>
          `${prev}\n\tDOCUMENT ${index} \n\t\tTitle:${curr.title}\n\t\tData:${curr.rag}`,
        '',
      )}\nINSTRUCTIONS: 
      ${args.instructions}
      QUESTION: \n${context.text}`;
    this.logger.verbose('Gemini: Prompt', prompt);
    const result = await model.generateContent(prompt);

    const envelope: StdOutgoingTextEnvelope = {
      format: OutgoingMessageFormat.text,
      message: {
        text: result.response.text(),
      },
    };
    return envelope;
  }

  private getInstance(token: string) {
    if (this.generativeAI) {
      return this.generativeAI;
    }

    try {
      this.generativeAI = new GoogleGenerativeAI(token);
      return this.generativeAI;
    } catch (err) {
      this.logger.warn('Gemini: Unable to instantiate GoogleGenerativeAI', err);
    }
  }
}
