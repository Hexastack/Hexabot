/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BadRequestException, Injectable } from '@nestjs/common';
import Papa from 'papaparse';
import { FindManyOptions, FindOptionsWhere } from 'typeorm';

import { StdOutgoingListMessage } from '@/chat/types/message';
import { ContentOptions } from '@/chat/types/options';
import { BaseOrmService } from '@/utils/generics/base-orm.service';

import {
  ContentCreateDto,
  ContentDtoConfig,
  ContentTransformerDto,
} from '../dto/content.dto';
import { ContentType } from '../dto/contentType.dto';
import { ContentOrmEntity } from '../entities/content.entity';
import { ContentRepository } from '../repositories/content.repository';
import { CONTENT_POPULATE, ContentPopulate } from '../types/content';

@Injectable()
export class ContentService extends BaseOrmService<
  ContentOrmEntity,
  ContentTransformerDto,
  ContentDtoConfig,
  ContentRepository
> {
  private readonly allowedPopulate: ContentPopulate[] = CONTENT_POPULATE;

  constructor(readonly repository: ContentRepository) {
    super(repository);
  }

  /**
   * Performs a text search on the content repository.
   *
   * @param query - The text query to search for.
   *
   * @return A list of content matching the search query.
   */
  async textSearch(query: string): Promise<ContentOrmEntity[]> {
    return await this.repository.textSearch(query);
  }

  /**
   * Retrieves content based on the provided options and pagination settings.
   *
   * @param options - Options that define how content should be fetched.
   * @param skip - Pagination offset, indicating the number of records to skip.
   *
   * @return The content with pagination info, or undefined if none found.
   */
  async getContent(
    options: ContentOptions,
    skip: number,
  ): Promise<Omit<StdOutgoingListMessage, 'options'>> {
    const where: FindOptionsWhere<ContentOrmEntity> = {
      status: true,
      ...(options.query as FindOptionsWhere<ContentOrmEntity> | undefined),
    };
    const limit = options.limit;

    if (typeof options.entity === 'string') {
      where.contentType = {
        id: options.entity,
      };
    }

    try {
      const countOptions: FindManyOptions<ContentOrmEntity> = { where };
      const total = await this.count(countOptions);

      if (total === 0) {
        this.logger.warn('No content found', where);
        throw new Error('No content found');
      }

      try {
        const findOptions: FindManyOptions<ContentOrmEntity> = {
          where,
          skip,
          take: limit,
          order: { createdAt: 'DESC' },
        };
        const contents = await this.find(findOptions);
        const elements = contents.map(ContentOrmEntity.toElement);

        return {
          elements,
          pagination: {
            total,
            skip,
            limit,
          },
        };
      } catch (err) {
        this.logger.error('Unable to retrieve content', err, where);
        throw err;
      }
    } catch (err) {
      this.logger.error('Unable to count content', err, where);
      throw err;
    }
  }

  /**
   * Parses a CSV dataset and saves the content in the repository.
   *
   * @param data - The CSV data as a string to be parsed.
   * @param contentType - The content type metadata, including fields to validate the parsed data.
   * @return A promise resolving to the created content objects.
   */
  async parseAndSaveDataset(data: string, contentType: ContentType) {
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
    if (!result.data.every((row) => row.title && row.status)) {
      throw new BadRequestException(
        'Missing required fields: "title" or "status"',
        {
          cause: 'Invalid CSV data',
          description: 'CSV must include "title" and "status" columns',
        },
      );
    }

    const contentsDto: ContentCreateDto[] = result.data.reduce(
      (acc, { title, status, ...rest }) => [
        ...acc,
        {
          title: String(title),
          status: status.trim().toLowerCase() === 'true',
          contentType: contentType.id,
          dynamicFields: Object.keys(rest)
            .filter((key) =>
              contentType.fields?.map((field) => field.name).includes(key),
            )
            .reduce(
              (filtered, key) => ({ ...filtered, [key]: rest[key] }),
              {} as Record<string, string>,
            ),
        },
      ],
      [] as ContentCreateDto[],
    );
    this.logger.log(`Parsed ${result.data.length} rows from CSV.`);
    try {
      return await this.createMany(contentsDto);
    } catch (err) {
      this.logger.error('Error occurred when extracting data. ', err);
    }
  }
}
