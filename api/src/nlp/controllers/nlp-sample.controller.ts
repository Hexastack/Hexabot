/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CsrfCheck } from '@tekuconcept/nestjs-csrf';
import { Response } from 'express';

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

import { NlpSampleDto, TNlpSampleDto } from '../dto/nlp-sample.dto';
import {
  NlpSample,
  NlpSampleFull,
  NlpSamplePopulate,
  NlpSampleStub,
} from '../schemas/nlp-sample.schema';
import { NlpSampleState } from '../schemas/types';
import { NlpEntityService } from '../services/nlp-entity.service';
import { NlpSampleEntityService } from '../services/nlp-sample-entity.service';
import { NlpSampleService } from '../services/nlp-sample.service';

@UseInterceptors(CsrfInterceptor)
@Controller('nlpsample')
export class NlpSampleController extends BaseController<
  NlpSample,
  NlpSampleStub,
  NlpSamplePopulate,
  NlpSampleFull,
  TNlpSampleDto
> {
  constructor(
    private readonly nlpSampleService: NlpSampleService,
    private readonly nlpSampleEntityService: NlpSampleEntityService,
    private readonly nlpEntityService: NlpEntityService,
    private readonly logger: LoggerService,
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

    const entities = nlpEntities
      ? await this.nlpSampleEntityService.storeSampleEntities(
          nlpSample,
          nlpEntities,
        )
      : [];

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
      const response = await helper.train?.(samples, entities);
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
    return await helper.evaluate?.(samples, entities);
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
    return this.canPopulate(populate)
      ? await this.nlpSampleService.findAndPopulate(filters, pageQuery)
      : await this.nlpSampleService.find(filters, pageQuery);
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

    await this.nlpSampleEntityService.deleteMany({ sample: id });

    const updatedSampleEntities =
      await this.nlpSampleEntityService.storeSampleEntities(
        sample,
        entities || [],
      );

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

  @CsrfCheck(true)
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importFile(@UploadedFile() file: Express.Multer.File) {
    const datasetContent = file.buffer.toString('utf-8');
    return await this.nlpSampleService.parseAndSaveDataset(datasetContent);
  }
}
