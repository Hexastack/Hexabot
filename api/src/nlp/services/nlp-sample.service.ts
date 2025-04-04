/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import Papa from 'papaparse';

import { Message } from '@/chat/schemas/message.schema';
import { Language } from '@/i18n/schemas/language.schema';
import { LanguageService } from '@/i18n/services/language.service';
import { BaseService } from '@/utils/generics/base-service';
import { THydratedDocument } from '@/utils/types/filter.types';

import { NlpSampleEntityCreateDto } from '../dto/nlp-sample-entity.dto';
import { NlpSampleCreateDto, TNlpSampleDto } from '../dto/nlp-sample.dto';
import { NlpSampleRepository } from '../repositories/nlp-sample.repository';
import { NlpEntityFull } from '../schemas/nlp-entity.schema';
import {
  NlpSample,
  NlpSampleFull,
  NlpSamplePopulate,
} from '../schemas/nlp-sample.schema';
import { NlpSampleEntityValue, NlpSampleState } from '../schemas/types';

import { NlpEntityService } from './nlp-entity.service';
import { NlpSampleEntityService } from './nlp-sample-entity.service';

@Injectable()
export class NlpSampleService extends BaseService<
  NlpSample,
  NlpSamplePopulate,
  NlpSampleFull,
  TNlpSampleDto
> {
  constructor(
    readonly repository: NlpSampleRepository,
    private readonly nlpSampleEntityService: NlpSampleEntityService,
    private readonly nlpEntityService: NlpEntityService,
    private readonly languageService: LanguageService,
  ) {
    super(repository);
  }

  /**
   * Fetches the samples and entities for a given sample type.
   *
   * @param type - The sample type (e.g., 'train', 'test').
   * @returns An object containing the samples and entities.
   */
  public async getAllSamplesAndEntitiesByType(type: NlpSample['type']) {
    const samples = await this.findAndPopulate({
      type,
    });

    const entities = await this.nlpEntityService.findAllAndPopulate();

    return { samples, entities };
  }

  /**
   * Deletes an NLP sample by its ID and cascades the operation if needed.
   *
   * @param id - The unique identifier of the NLP sample to delete.
   *
   * @returns A promise resolving when the sample is deleted.
   */
  async deleteCascadeOne(id: string) {
    return await this.repository.deleteOne(id);
  }

  /**
   * This function is responsible for parsing a CSV dataset string and saving the parsed data into the database.
   * It ensures that all necessary entities and languages exist, validates the dataset, and processes it row by row
   * to create NLP samples and associated entities in the system.
   *
   * @param data - The raw CSV dataset as a string.
   * @returns A promise that resolves to an array of created NLP samples.
   */
  async parseAndSaveDataset(data: string) {
    const allEntities = await this.nlpEntityService.findAll();
    // Check if file location is present
    if (allEntities.length === 0) {
      throw new NotFoundException(
        'No entities found, please create them first.',
      );
    }

    // Parse local CSV file
    const result: {
      errors: any[];
      data: Array<Record<string, string>>;
    } = Papa.parse(data, {
      header: true,
      skipEmptyLines: true,
    });

    if (result.errors && result.errors.length > 0) {
      this.logger.warn(
        `Errors parsing the file: ${JSON.stringify(result.errors)}`,
      );
      throw new BadRequestException(result.errors, {
        cause: result.errors,
        description: 'Error while parsing CSV',
      });
    }
    // Remove data with no intent
    const filteredData = result.data.filter((d) => d.intent !== 'none');
    const languages = await this.languageService.getLanguages();
    const defaultLanguage = await this.languageService.getDefaultLanguage();
    const nlpSamples: NlpSample[] = [];
    // Reduce function to ensure executing promises one by one
    for (const d of filteredData) {
      try {
        // Check if a sample with the same text already exists
        const existingSamples = await this.find({
          text: d.text,
        });

        // Skip if sample already exists
        if (Array.isArray(existingSamples) && existingSamples.length > 0) {
          continue;
        }

        // Fallback to default language if 'language' is missing or invalid
        if (!d.language || !(d.language in languages)) {
          if (d.language) {
            this.logger.warn(
              `Language "${d.language}" does not exist, falling back to default.`,
            );
          }
          d.language = defaultLanguage.code;
        }

        // Create a new sample dto
        const sample: NlpSampleCreateDto = {
          text: d.text,
          trained: false,
          language: languages[d.language].id,
        };

        // Create a new sample entity dto
        const entities: NlpSampleEntityValue[] = allEntities
          .filter(({ name }) => name in d)
          .map(({ name }) => ({
            entity: name,
            value: d[name],
          }));

        // Store any new entity/value
        const storedEntities = await this.nlpEntityService.storeNewEntities(
          sample.text,
          entities,
          ['trait'],
        );

        // Store sample
        const createdSample = await this.create(sample);
        nlpSamples.push(createdSample);
        // Map and assign the sample ID to each stored entity
        const sampleEntities = storedEntities.map((storedEntity) => ({
          ...storedEntity,
          sample: createdSample?.id,
        }));

        // Store sample entities
        await this.nlpSampleEntityService.createMany(sampleEntities);
      } catch (err) {
        this.logger.error('Error occurred when extracting data. ', err);
      }
    }

    return nlpSamples;
  }

  /**
   * Iterates through all text samples stored in the database,
   * checks if the given keyword exists within each sample, and if so, appends it as an entity.
   * The function ensures that duplicate entities are not added and logs the updates.
   *
   * @param entity The entity
   */
  async annotateWithKeywordEntity(entity: NlpEntityFull) {
    for (const value of entity.values) {
      // For each value, get any sample that may contain the keyword or any of it's synonyms
      const keywords = [value.value, ...value.expressions];
      const samples = await this.find({
        text: { $regex: `\\b(${keywords.join('|')})\\b`, $options: 'i' },
        type: ['train', 'test'],
      });

      if (samples.length > 0) {
        this.logger.debug(
          `Annotating ${entity.name} - ${value.value} in ${samples.length} sample(s) ...`,
        );

        for (const sample of samples) {
          try {
            const matches: NlpSampleEntityCreateDto[] =
              this.nlpSampleEntityService.extractKeywordEntities(sample, value);

            if (!matches.length) {
              throw new Error('Something went wrong, unable to match keywords');
            }

            const updates = matches.map((dto) =>
              this.nlpSampleEntityService.findOneOrCreate(dto, dto),
            );

            await Promise.all(updates);

            this.logger.debug(
              `Successfully annotate sample with ${updates.length} matches: ${sample.text}`,
            );
          } catch (err) {
            this.logger.error(`Failed to annotate sample: ${sample.text}`);
          }
        }
      }
    }
  }

  /**
   * When a language gets deleted, we need to set related samples to null
   *
   * @param language The language that has been deleted.
   */
  @OnEvent('hook:language:delete')
  async handleLanguageDelete(language: Language) {
    await this.updateMany(
      {
        language: language.id,
      },
      {
        language: null,
      },
    );
  }

  @OnEvent('hook:message:preCreate')
  async handleNewMessage(doc: THydratedDocument<Message>) {
    // If message is sent by the user then add it as an inbox sample
    if (
      'sender' in doc &&
      doc.sender &&
      'message' in doc &&
      'text' in doc.message
    ) {
      const defaultLang = await this.languageService.getDefaultLanguage();
      const record: NlpSampleCreateDto = {
        text: doc.message.text,
        type: NlpSampleState.inbox,
        trained: false,
        // @TODO : We need to define the language in the message entity
        language: defaultLang.id,
      };
      try {
        await this.findOneOrCreate(record, record);
        this.logger.debug('User message saved as a inbox sample !');
      } catch (err) {
        this.logger.warn('Unable to add message as a new inbox sample!', err);
      }
    }
  }
}
