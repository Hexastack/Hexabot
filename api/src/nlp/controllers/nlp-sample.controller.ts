/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import fs from 'fs';
import { join } from 'path';
import { Readable } from 'stream';

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
  UseInterceptors,
} from '@nestjs/common';
import { CsrfCheck } from '@tekuconcept/nestjs-csrf';
import { Response } from 'express';
import Papa from 'papaparse';

import { AttachmentService } from '@/attachment/services/attachment.service';
import { config } from '@/config';
import { HelperService } from '@/helper/helper.service';
import { LanguageService } from '@/i18n/services/language.service';
import { CsrfInterceptor } from '@/interceptors/csrf.interceptor';
import { LoggerService } from '@/logger/logger.service';
import { BaseController } from '@/utils/generics/base-controller';
import { DeleteResult } from '@/utils/generics/base-repository';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';
import { PageQueryPipe } from '@/utils/pagination/pagination-query.pipe';
import { PopulatePipe } from '@/utils/pipes/populate.pipe';
import { SearchFilterPipe } from '@/utils/pipes/search-filter.pipe';
import { TFilterQuery } from '@/utils/types/filter.types';

import { NlpSampleCreateDto, NlpSampleDto } from '../dto/nlp-sample.dto';
import {
  NlpSample,
  NlpSampleFull,
  NlpSamplePopulate,
  NlpSampleStub,
} from '../schemas/nlp-sample.schema';
import { NlpSampleEntityValue, NlpSampleState } from '../schemas/types';
import { NlpEntityService } from '../services/nlp-entity.service';
import { NlpSampleEntityService } from '../services/nlp-sample-entity.service';
import { NlpSampleService } from '../services/nlp-sample.service';
import { NlpService } from '../services/nlp.service';

@UseInterceptors(CsrfInterceptor)
@Controller('nlpsample')
export class NlpSampleController extends BaseController<
  NlpSample,
  NlpSampleStub,
  NlpSamplePopulate,
  NlpSampleFull
> {
  constructor(
    private readonly nlpSampleService: NlpSampleService,
    private readonly attachmentService: AttachmentService,
    private readonly nlpSampleEntityService: NlpSampleEntityService,
    private readonly nlpEntityService: NlpEntityService,
    private readonly logger: LoggerService,
    private readonly nlpService: NlpService,
    private readonly languageService: LanguageService,
    private readonly helperService: HelperService,
  ) {
    super(nlpSampleService);
  }

  /**
   * Exports the NLP samples in a formatted JSON file, using the Rasa NLU format.
   *
   * @param response - Response object to handle file download.
   * @param type - Optional filter for NLP sample type.
   *
   * @returns A streamable JSON file containing the exported data.
   */
  @Get('export')
  async export(
    @Res({ passthrough: true }) response: Response,
    @Query('type') type?: NlpSampleState,
  ) {
    const samples = await this.nlpSampleService.findAndPopulate(
      type ? { type } : {},
    );
    const entities = await this.nlpEntityService.findAllAndPopulate();
    const helper = await this.helperService.getDefaultNluHelper();
    const result = await helper.format(samples, entities);

    // Sending the JSON data as a file
    const buffer = Buffer.from(JSON.stringify(result));
    const readableInstance = new Readable({
      read() {
        this.push(buffer);
        this.push(null); // indicates the end of the stream
      },
    });

    return new StreamableFile(readableInstance, {
      type: 'application/json',
      disposition: `attachment; filename=nlp_export${
        type ? `_${type}` : ''
      }.json`,
    });
  }

  /**
   * Creates a new NLP sample with associated entities.
   *
   * @param createNlpSampleDto - The DTO containing the NLP sample and its entities.
   *
   * @returns The newly created NLP sample with its entities.
   */
  @CsrfCheck(true)
  @Post()
  async create(
    @Body()
    {
      entities: nlpEntities,
      language: languageCode,
      ...createNlpSampleDto
    }: NlpSampleDto,
  ): Promise<NlpSampleFull> {
    const language = await this.languageService.getLanguageByCode(languageCode);
    const nlpSample = await this.nlpSampleService.create({
      ...createNlpSampleDto,
      language: language.id,
    });

    const entities = await this.nlpSampleEntityService.storeSampleEntities(
      nlpSample,
      nlpEntities,
    );

    return {
      ...nlpSample,
      entities,
      language,
    };
  }

  /**
   * Counts the filtered number of NLP samples.
   *
   * @param filters - The filters to apply when counting samples.
   *
   * @returns The count of samples that match the filters.
   */
  @Get('count')
  async filterCount(
    @Query(new SearchFilterPipe<NlpSample>({ allowedFields: ['text', 'type'] }))
    filters?: TFilterQuery<NlpSample>,
  ) {
    return await this.count(filters);
  }

  /**
   * Analyzes the input text using the NLP service and returns the parsed result.
   *
   * @param text - The input text to be analyzed.
   *
   * @returns The result of the NLP parsing process.
   */
  @Get('message')
  async message(@Query('text') text: string) {
    const helper = await this.helperService.getDefaultNluHelper();
    return helper.predict(text);
  }

  /**
   * Fetches the samples and entities for a given sample type.
   *
   * @param type - The sample type (e.g., 'train', 'test').
   * @returns An object containing the samples and entities.
   * @private
   */
  private async getSamplesAndEntitiesByType(type: NlpSample['type']) {
    const samples = await this.nlpSampleService.findAndPopulate({
      type,
    });

    const entities = await this.nlpEntityService.findAllAndPopulate();

    return { samples, entities };
  }

  /**
   * Initiates the training process for the NLP service using the 'train' sample type.
   *
   * @returns The result of the training process.
   */
  @Get('train')
  async train() {
    const { samples, entities } =
      await this.getSamplesAndEntitiesByType('train');

    try {
      const helper = await this.helperService.getDefaultNluHelper();
      const response = await helper.train(samples, entities);
      // Mark samples as trained
      await this.nlpSampleService.updateMany(
        { type: 'train' },
        { trained: true },
      );
      return response;
    } catch (err) {
      this.logger.error(err);
      throw new InternalServerErrorException(
        'Unable to perform the train operation',
      );
    }
  }

  /**
   * Evaluates the NLP service using the 'test' sample type.
   *
   * @returns The result of the evaluation process.
   */
  @Get('evaluate')
  async evaluate() {
    const { samples, entities } =
      await this.getSamplesAndEntitiesByType('test');

    const helper = await this.helperService.getDefaultNluHelper();
    return await helper.evaluate(samples, entities);
  }

  /**
   * Finds a single NLP sample by its ID.
   *
   * @param id - The ID of the NLP sample to find.
   * @param populate - Fields to populate in the returned sample.
   *
   * @returns The requested NLP sample if found.
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query(PopulatePipe) populate: string[],
  ) {
    const doc = this.canPopulate(populate)
      ? await this.nlpSampleService.findOneAndPopulate(id)
      : await this.nlpSampleService.findOne(id);
    if (!doc) {
      this.logger.warn(`Unable to find NLP Sample by id ${id}`);
      throw new NotFoundException(`NLP Sample with ID ${id} not found`);
    }
    return doc;
  }

  /**
   * Finds a paginated list of NLP samples.
   *
   * @param pageQuery - The query for pagination.
   * @param populate - Fields to populate in the returned samples.
   * @param filters - Filters to apply when fetching samples.
   *
   * @returns A paginated list of NLP samples.
   */
  @Get()
  async findPage(
    @Query(PageQueryPipe) pageQuery: PageQueryDto<NlpSample>,
    @Query(PopulatePipe) populate: string[],
    @Query(
      new SearchFilterPipe<NlpSample>({
        allowedFields: ['text', 'type', 'language'],
      }),
    )
    filters: TFilterQuery<NlpSample>,
  ) {
    if (pageQuery.limit) {
      return this.canPopulate(populate)
        ? await this.nlpSampleService.findPageAndPopulate(filters, pageQuery)
        : await this.nlpSampleService.findPage(filters, pageQuery);
    }

    return this.canPopulate(populate)
      ? await this.nlpSampleService.findAndPopulate(filters, pageQuery.sort)
      : await this.nlpSampleService.find(filters, pageQuery.sort);
  }

  /**
   * Updates an existing NLP sample by its ID.
   *
   * @param id - The ID of the NLP sample to update.
   * @param updateNlpSampleDto - The DTO containing the updated sample data.
   *
   * @returns The updated NLP sample with its entities.
   */
  @CsrfCheck(true)
  @Patch(':id')
  async updateOne(
    @Param('id') id: string,
    @Body() { entities, language: languageCode, ...sampleAttrs }: NlpSampleDto,
  ): Promise<NlpSampleFull> {
    const language = await this.languageService.getLanguageByCode(languageCode);
    const sample = await this.nlpSampleService.updateOne(id, {
      ...sampleAttrs,
      language: language.id,
      trained: false,
    });

    if (!sample) {
      this.logger.warn(`Unable to update NLP Sample by id ${id}`);
      throw new NotFoundException(`NLP Sample with ID ${id} not found`);
    }

    await this.nlpSampleEntityService.deleteMany({ sample: id });

    const updatedSampleEntities =
      await this.nlpSampleEntityService.storeSampleEntities(sample, entities);

    return {
      ...sample,
      language,
      entities: updatedSampleEntities,
    };
  }

  /**
   * Deletes an NLP sample by its ID.
   *
   * @param id - The ID of the NLP sample to delete.
   *
   * @returns The result of the deletion operation.
   */
  @CsrfCheck(true)
  @Delete(':id')
  @HttpCode(204)
  async deleteOne(@Param('id') id: string) {
    const result = await this.nlpSampleService.deleteCascadeOne(id);
    if (result.deletedCount === 0) {
      this.logger.warn(`Unable to delete NLP Sample by id ${id}`);
      throw new NotFoundException(`NLP Sample with ID ${id} not found`);
    }
    return result;
  }

  /**
   * Deletes multiple NLP samples by their IDs.
   * @param ids - IDs of NLP samples to be deleted.
   * @returns A Promise that resolves to the deletion result.
   */
  @CsrfCheck(true)
  @Delete('')
  @HttpCode(204)
  async deleteMany(@Body('ids') ids: string[]): Promise<DeleteResult> {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('No IDs provided for deletion.');
    }
    const deleteResult = await this.nlpSampleService.deleteMany({
      _id: { $in: ids },
    });

    if (deleteResult.deletedCount === 0) {
      this.logger.warn(
        `Unable to delete NLP samples with provided IDs: ${ids}`,
      );
      throw new NotFoundException('NLP samples with provided IDs not found');
    }

    this.logger.log(`Successfully deleted NLP samples with IDs: ${ids}`);
    return deleteResult;
  }

  /**
   * Imports NLP samples from a CSV file.
   *
   * @param file - The file path or ID of the CSV file to import.
   *
   * @returns A success message after the import process is completed.
   */
  @CsrfCheck(true)
  @Post('import/:file')
  async import(
    @Param('file')
    file: string,
  ) {
    // Check if file is present
    const importedFile = await this.attachmentService.findOne(file);
    if (!importedFile) {
      throw new NotFoundException('Missing file!');
    }
    const filePath = importedFile
      ? join(config.parameters.uploadDir, importedFile.location)
      : undefined;

    // Check if file location is present
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File does not exist');
    }

    const allEntities = await this.nlpEntityService.findAll();

    // Check if file location is present
    if (allEntities.length === 0) {
      throw new NotFoundException(
        'No entities found, please create them first.',
      );
    }

    // Read file content
    const data = fs.readFileSync(filePath, 'utf8');

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
    // Reduce function to ensure executing promises one by one
    for (const d of filteredData) {
      try {
        // Check if a sample with the same text already exists
        const existingSamples = await this.nlpSampleService.find({
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
          .map(({ name }) => {
            return {
              entity: name,
              value: d[name],
            };
          });

        // Store any new entity/value
        const storedEntities = await this.nlpEntityService.storeNewEntities(
          sample.text,
          entities,
          ['trait'],
        );
        // Store sample
        const createdSample = await this.nlpSampleService.create(sample);
        // Map and assign the sample ID to each stored entity
        const sampleEntities = storedEntities.map((se) => ({
          ...se,
          sample: createdSample?.id,
        }));

        // Store sample entities
        await this.nlpSampleEntityService.createMany(sampleEntities);
      } catch (err) {
        this.logger.error('Error occurred when extracting data. ', err);
      }
    }

    this.logger.log('Import process completed successfully.');
    return { success: true };
  }
}
