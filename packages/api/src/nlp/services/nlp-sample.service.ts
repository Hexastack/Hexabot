/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BaseOrmService } from '@hexabot/core/database';
import { LoggerService } from '@hexabot/logger';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import Papa from 'papaparse';
import { FindManyOptions, FindOptionsOrder, InsertEvent } from 'typeorm';

import { MessageOrmEntity } from '@/chat/entities/message.entity';
import { NlpValueMatchPattern } from '@/chat/types/pattern';
import { LanguageService } from '@/i18n/services/language.service';

import { NlpSampleEntityValue, NlpSampleState } from '..//types';
import { NlpEntityFull } from '../dto/nlp-entity.dto';
import { NlpSampleEntityCreateDto } from '../dto/nlp-sample-entity.dto';
import {
  NlpSample,
  NlpSampleCreateDto,
  NlpSampleFull,
  NlpSampleTransformerDto,
  TNlpSampleDto,
} from '../dto/nlp-sample.dto';
import { NlpSampleOrmEntity } from '../entities/nlp-sample.entity';
import { NlpSampleRepository } from '../repositories/nlp-sample.repository';

import { NlpEntityService } from './nlp-entity.service';
import { NlpSampleEntityService } from './nlp-sample-entity.service';
import { NlpValueService } from './nlp-value.service';

@Injectable()
export class NlpSampleService extends BaseOrmService<
  NlpSampleOrmEntity,
  NlpSampleTransformerDto,
  TNlpSampleDto
> {
  constructor(
    readonly repository: NlpSampleRepository,
    private readonly nlpSampleEntityService: NlpSampleEntityService,
    private readonly nlpEntityService: NlpEntityService,
    private readonly nlpValueService: NlpValueService,
    private readonly languageService: LanguageService,
    private readonly logger: LoggerService,
  ) {
    super(repository);
  }

  /**
   * Retrieve samples that satisfy `filters` **and** reference any entity / value
   * contained in `patterns`.
   *
   * The pattern list is first resolved via `NlpEntityService.findByPatterns`
   * and `NlpValueService.findByPatterns`, then delegated to
   * `repository.findByEntities`.
   *
   * @param options    Pagination, sorting, and filter options.
   * @param patterns   Value match constraints used to resolve related entities.
   * @returns Promise resolving to the matching samples.
   */
  async findByPatterns({
    options,
    patterns,
  }: {
    options?: FindManyOptions<NlpSampleOrmEntity>;
    patterns: NlpValueMatchPattern[];
  }): Promise<NlpSample[]> {
    const normalizedOptions = this.normalizeOptions(options);

    if (!patterns.length) {
      return await this.repository.find(normalizedOptions);
    }

    const values = await this.nlpValueService.findByPatterns(patterns);

    if (!values.length) {
      return [];
    }

    return await this.repository.findByEntities({
      options: normalizedOptions,
      values,
    });
  }

  /**
   * Same as `findByPatterns`, but also populates all relations declared
   * in the repository (`populatePaths`).
   *
   * @param options    Pagination, sorting, and filter options.
   * @param patterns   Value match constraints used to resolve related entities.
   * @returns Promise resolving to the populated samples.
   */
  async findByPatternsAndPopulate({
    options,
    patterns,
  }: {
    options?: FindManyOptions<NlpSampleOrmEntity>;
    patterns: NlpValueMatchPattern[];
  }): Promise<NlpSampleFull[]> {
    const normalizedOptions = this.normalizeOptions(options);

    if (!patterns.length) {
      return await this.repository.findAndPopulate(normalizedOptions);
    }

    const values = await this.nlpValueService.findByPatterns(patterns);

    if (!values.length) {
      return [];
    }

    return await this.repository.findByEntitiesAndPopulate({
      options: normalizedOptions,
      values,
    });
  }

  /**
   * Count how many samples satisfy `options.where` and reference any entity / value
   * present in `patterns`.
   *
   * @param param0 `{ options, patterns }`
   * @returns Promise resolving to the count.
   */
  async countByPatterns({
    options,
    patterns,
  }: {
    options?: FindManyOptions<NlpSampleOrmEntity>;
    patterns: NlpValueMatchPattern[];
  }): Promise<number> {
    const normalizedOptions = this.normalizeOptions(options);

    if (!patterns.length) {
      return await this.repository.count(normalizedOptions);
    }

    const values = await this.nlpValueService.findByPatterns(patterns);

    if (!values.length) {
      return 0;
    }

    return await this.repository.countByEntities({
      options: normalizedOptions,
      values,
    });
  }

  private normalizeOptions(
    options?: FindManyOptions<NlpSampleOrmEntity>,
  ): FindManyOptions<NlpSampleOrmEntity> {
    const normalized: FindManyOptions<NlpSampleOrmEntity> = {
      ...(options ?? {}),
    };
    const hasOrder =
      normalized.order &&
      Object.keys(normalized.order as Record<string, unknown>).length > 0;

    if (!hasOrder) {
      normalized.order = {
        createdAt: 'DESC',
      } as FindOptionsOrder<NlpSampleOrmEntity>;
    }

    return normalized;
  }

  /**
   * Fetches the samples and entities for a given sample type.
   *
   * @param type - The sample type (e.g., 'train', 'test').
   * @returns An object containing the samples and entities.
   */
  public async getAllSamplesAndEntitiesByType(type: NlpSample['type']) {
    const samples = await this.findAndPopulate({
      where: { type },
    });
    const entities = await this.nlpEntityService.findAllAndPopulate();

    return { samples, entities };
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
          where: {
            text: d.text,
          },
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
        const sampleEntities: NlpSampleEntityCreateDto[] = storedEntities.map(
          ({ entity, value, start, end }) => ({
            sample: createdSample?.id,
            entity,
            value,
            start,
            end,
          }),
        );

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
      const keywords = [value.value, ...value.expressions]
        .map((keyword) => keyword?.trim())
        .filter((keyword): keyword is string => Boolean(keyword));

      if (!keywords.length) {
        continue;
      }

      const samples = await this.repository.findContainingKeywords(keywords, [
        NlpSampleState.train,
        NlpSampleState.test,
      ]);

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
              this.nlpSampleEntityService.findOneOrCreate(
                {
                  where: {
                    sample: { id: dto.sample },
                    entity: { id: dto.entity },
                    value: { id: dto.value },
                  },
                },
                dto,
              ),
            );

            await Promise.all(updates);

            this.logger.debug(
              `Successfully annotate sample with ${updates.length} matches: ${sample.text}`,
            );
          } catch (err) {
            this.logger.error(`Failed to annotate sample: ${sample.text}`, err);
          }
        }
      }
    }
  }

  @OnEvent('hook:message:preCreate')
  async handleNewMessage({ entity: e }: InsertEvent<MessageOrmEntity>) {
    // If message is sent by the user then add it as an inbox sample
    if ('sender' in e && e.sender && 'message' in e && 'text' in e.message) {
      const defaultLang = await this.languageService.getDefaultLanguage();
      const record: NlpSampleCreateDto = {
        text: e.message.text,
        type: NlpSampleState.inbox,
        trained: false,
        language: defaultLang.id,
      };
      try {
        await this.findOneOrCreate({ where: { text: record.text } }, record);
        this.logger.debug('User message saved as a inbox sample !');
      } catch (err) {
        this.logger.warn('Unable to add message as a new inbox sample!', err);
      }
    }
  }
}
