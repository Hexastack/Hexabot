import { Injectable } from '@nestjs/common';

import { Block } from '@/chat/schemas/block.schema';
import { Context } from '@/chat/schemas/types/context';
import {
  OutgoingMessageFormat,
  StdOutgoingTextEnvelope,
} from '@/chat/schemas/types/message';
import { MessageService } from '@/chat/services/message.service';
import { ContentService } from '@/cms/services/content.service';
import OllamaLlmHelper from '@/extensions/helpers/ollama/index.helper';
import { HelperService } from '@/helper/helper.service';
import { HelperType } from '@/helper/types';
import { LoggerService } from '@/logger/logger.service';
import { BaseBlockPlugin } from '@/plugins/base-block-plugin';
import { PluginService } from '@/plugins/plugins.service';
import { PluginBlockTemplate } from '@/plugins/types';

import SETTINGS from './settings';

@Injectable()
export class OllamaPlugin extends BaseBlockPlugin<typeof SETTINGS> {
  template: PluginBlockTemplate = { name: 'Ollama Plugin' };

  constructor(
    pluginService: PluginService,
    private helperService: HelperService,
    private logger: LoggerService,
    private contentService: ContentService,
    private messageService: MessageService,
  ) {
    super('ollama-plugin', pluginService);
  }

  getPath(): string {
    return __dirname;
  }

  async process(block: Block, context: Context, _convId: string) {
    const args = this.getArguments(block);

    try {
      const ragContent = await this.contentService.textSearch(context.text);

      const systemPrompt = [
        `CONTEXT: ${args.context}`,
        `DOCUMENTS:`,
        ...ragContent.map(
          (curr, index) =>
            `\tDOCUMENT ${index + 1} \n\t\tTitle: ${curr.title} \n\t\tData: ${curr.rag}`,
        ),
        `INSTRUCTIONS:`,
        args.instructions,
      ].join('\n');

      this.logger.debug('Ollama: Prompt', systemPrompt);

      const ollamaHelper = this.helperService.use(
        HelperType.LLM,
        OllamaLlmHelper,
      );

      const history = await this.messageService.findLastMessages(
        context.user,
        args.max_messages_ctx,
      );

      const options = this.settings
        .filter(
          (setting) => 'subgroup' in setting && setting.subgroup === 'options',
        )
        .reduce((acc, { label }) => {
          acc[label] = args[label];
          return acc;
        }, {});

      // Call Ollama API
      const result = await ollamaHelper.generateChatCompletion(
        context.text,
        args.model,
        systemPrompt,
        history,
        {
          keepAlive: args.keep_alive,
          options,
        },
      );

      const envelope: StdOutgoingTextEnvelope = {
        format: OutgoingMessageFormat.text,
        message: {
          text: result,
        },
      };

      return envelope;
    } catch (err) {
      this.logger.error('Ollama Plugin: Something went wrong ...');
      // Send fallback message
      const envelope: StdOutgoingTextEnvelope = {
        format: OutgoingMessageFormat.text,
        message: {
          text: args.fallback_message,
        },
      };

      return envelope;
    }
  }
}
