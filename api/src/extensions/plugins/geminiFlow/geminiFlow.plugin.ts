import { GoogleGenerativeAI } from '@google/generative-ai'; // Importing Google Generative AI
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Block } from '@/chat/schemas/block.schema';
import { Context } from '@/chat/schemas/types/context';
import {
  OutgoingMessageFormat,
  StdOutgoingTextEnvelope,
} from '@/chat/schemas/types/message';
import { BlockService } from '@/chat/services/block.service';
import { CategoryService } from '@/chat/services/category.service';
import { MessageService } from '@/chat/services/message.service';
import { ContentService } from '@/cms/services/content.service';
import { LoggerService } from '@/logger/logger.service';
import { BaseBlockPlugin } from '@/plugins/base-block-plugin';
import { PluginService } from '@/plugins/plugins.service';
import { SettingType } from '@/setting/schemas/types';

@Injectable()
export class GeminiFlowPlugin extends BaseBlockPlugin {
  private generativeAI: GoogleGenerativeAI;

  constructor(
    pluginService: PluginService,
    private logger: LoggerService,
    private contentService: ContentService,
    private messageService: MessageService,
    private blockService: BlockService,
    private categoryService: CategoryService,
    private eventEmitter: EventEmitter2,
  ) {
    super('gemini-flow-plugin', pluginService);

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
        id: 'maxLength',
        label: 'Max Length',
        group: 'default',
        type: SettingType.number,
        value: 4048, // Default value for max length
      },
      {
        id: 'messagesToRetrieve',
        label: 'Messages to Retrieve',
        group: 'default',
        type: SettingType.number,
        value: 5, // Default number of messages to retrieve for context
      },
      {
        id: 'context',
        label: 'Context',
        group: 'default',
        type: SettingType.textarea,
        value: `help client to generate a JSON respecting the typescript type bellow

type TBlocks =
  | {
      shortTitle: string;
      question: string;
      respond: string;
      step: number;
      action: string;
      type: 'text';
    }
  | {
      shortTitle: string;
      question: string;
      respond: string;
      step: number;
      action: string;
      type: 'multiple-chooses';
      options: string[];
    };`,
      },
      {
        id: 'instructions',
        label: 'Instructions',
        group: 'default',
        type: SettingType.textarea,
        value: `STEPS are ordered from specific topic to public topic.
NO welcome STEP.
only the last STEP need to be of type 'text' containing a confirming of the operation without questions.
flow STEPS number is between 5 and 7.
'multiple-chooses' type max OPTIONS number is 3 or less.
OPTION length don't exceed 20 characters.
OPTIONS need to be informative no actions are allowed.`,
      },
    ];

    this.title = 'Gemini Flow Plugin';

    this.template = { name: 'Gemini Flow Plugin' };

    this.effects = {
      onStoreContextData: () => {},
    };
  }

  private async getMessagesContext(context: Context, messagesToRetrieve = 5) {
    // Retrieve the last few messages for context
    const recentMessages = await this.messageService.findPage(
      {
        $or: [{ sender: context.user.id }, { recipient: context.user.id }],
      },
      { sort: ['createdAt', 'desc'], skip: 0, limit: messagesToRetrieve },
    );

    const messagesContext = recentMessages
      .reverse()
      .map((m) => {
        const text =
          'text' in m.message && m.message.text
            ? m.message.text
            : JSON.stringify(m.message);
        return 'sender' in m && m.sender ? `user: ${text}` : `bot: ${text}`;
      })
      .join('\n');

    return messagesContext;
  }

  async process(block: Block, context: Context, _convId: string) {
    const ragContent = await this.contentService.textSearch(context.text);
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
        maxOutputTokens: args['maxLength'] || 256, // Use maxLength setting for the response length
      },
    });

    const messagesContext = await this.getMessagesContext(
      context,
      args['messagesToRetrieve'],
    );

    const prompt = [
      `CONTEXT: ${args.context}`,
      `DOCUMENTS:`,
      ...ragContent.map(
        (curr, index) =>
          `\tDOCUMENT ${index + 1} \n\t\tTitle: ${curr.title} \n\t\tData: ${curr.rag}`,
      ),
      `RECENT MESSAGES:`,
      messagesContext,
      `INSTRUCTIONS:`,
      args.instructions,
      `QUESTION:`,
      context.text,
    ].join('\n');
    this.logger.debug('Gemini: Prompt', prompt);
    const result = await model.generateContent(prompt);
    const textResponse = result.response.text();

    let envelope: StdOutgoingTextEnvelope = {
      format: OutgoingMessageFormat.text,
      message: {
        text: 'This case is not support !',
      },
    };

    const hasJSONResponse = /\[[^]+\]/.test(textResponse);
    const hasHotKeys = ['generate', 'flow'].every((key) =>
      context.text.includes(key),
    );

    if (hasJSONResponse && hasHotKeys) {
      const [generatedStepsText] = textResponse.match(/\[[^]+\]/);

      //TODO cover exception
      const generatedStepsTextParsed: any[] = JSON.parse(generatedStepsText);

      const { id: aiGeneratedFlowId } =
        await this.categoryService.findOneOrCreate(
          { label: 'AI Flow' },
          { label: 'AI Flow', zoom: 40, offset: [90, 140] },
        );

      await this.blockService.deleteMany({ category: aiGeneratedFlowId });
      const blocks = (await Promise.all(
        generatedStepsTextParsed.map(async (generatedStepTextParsed, index) => {
          return await this.blockService.create({
            patterns: [index === 0 ? 'yes' : generatedStepTextParsed.question],
            options: {
              typing: 0,
              fallback: { active: false, max_attempts: 1, message: [] },
              effects: [],
            },
            message: (generatedStepTextParsed.type === 'multiple-chooses' &&
            generatedStepTextParsed.options
              ? {
                  quickReplies: (generatedStepTextParsed.options as any[]).map(
                    (option) => ({
                      content_type: 'text',
                      title: String(option),
                      payload: String(option),
                    }),
                  ),
                  text: generatedStepTextParsed.question,
                }
              : [generatedStepTextParsed.respond]) as any,
            starts_conversation: index === 0,
            category: aiGeneratedFlowId,
            name: String(generatedStepTextParsed.shortTitle),

            position: { x: 430 * index, y: 20 * index },
          });
        }),
      )) as unknown as Block[];

      //link blocks
      blocks.map((block, index) =>
        this.blockService.updateOne(
          { _id: block.id },
          {
            patterns:
              index == 0
                ? block.patterns
                : blocks[index - 1].message['quickReplies'].map(
                    (quickReply) => quickReply.payload,
                  ),
            nextBlocks: blocks[index + 1] && [blocks[index + 1].id],
          },
        ),
      );

      this.eventEmitter.emit('hook:gemini:flowGenerated', ['navigateToAiFlow']);

      envelope = {
        ...envelope,
        message: {
          ...envelope.message,
          text: 'Do you want my assistance ?',
        },
      };
    }

    // console.log(JSON.parse(result.response.text()));
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
