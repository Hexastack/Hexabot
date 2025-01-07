/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';

import { Attachment } from '@/attachment/schemas/attachment.schema';
import { AttachmentService } from '@/attachment/services/attachment.service';
import { WithUrl } from '@/chat/schemas/types/attachment';
import {
  ContentElement,
  StdOutgoingListMessage,
} from '@/chat/schemas/types/message';
import { ContentOptions } from '@/chat/schemas/types/options';
import { LoggerService } from '@/logger/logger.service';
import { BaseService } from '@/utils/generics/base-service';
import { TFilterQuery } from '@/utils/types/filter.types';

import { ContentRepository } from '../repositories/content.repository';
import {
  Content,
  ContentFull,
  ContentPopulate,
} from '../schemas/content.schema';

@Injectable()
export class ContentService extends BaseService<
  Content,
  ContentPopulate,
  ContentFull
> {
  constructor(
    readonly repository: ContentRepository,
    private readonly attachmentService: AttachmentService,
    private readonly logger: LoggerService,
  ) {
    super(repository);
  }

  /**
   * Performs a text search on the content repository.
   *
   * @param query - The text query to search for.
   *
   * @return A list of content matching the search query.
   */
  async textSearch(query: string) {
    return await this.repository.textSearch(query);
  }

  /**
   * Extracts attachment IDs from content entities, issuing warnings for any issues.
   *
   * @param contents - An array of content entities.
   * @param attachmentFieldName - The name of the attachment field to check for.
   *
   * @return A list of attachment IDs.
   */
  getAttachmentIds(contents: ContentElement[], attachmentFieldName: string) {
    return contents.reduce((acc, content) => {
      if (attachmentFieldName in content) {
        const attachment = content[attachmentFieldName];

        if (
          typeof attachment === 'object' &&
          'attachment_id' in attachment.payload
        ) {
          acc.push(attachment.payload.attachment_id);
        } else {
          this.logger.error(
            `Remote attachments have been deprecated, content "${content.title}" is missing the "attachment_id"`,
          );
        }
      } else {
        this.logger.warn(
          `Field "${attachmentFieldName}" not found in content "${content.title}"`,
        );
      }
      return acc;
    }, [] as string[]);
  }

  /**
   * Populates attachment fields within content entities with detailed attachment information.
   *
   * @param elements - An array of content entities.
   * @param attachmentFieldName - The name of the attachment field to populate.
   *
   * @return A list of content with populated attachment data.
   */
  async populateAttachments(
    elements: ContentElement[],
    attachmentFieldName: string,
  ): Promise<ContentElement[]> {
    const attachmentIds = this.getAttachmentIds(elements, attachmentFieldName);

    if (attachmentIds.length > 0) {
      const attachments = await this.attachmentService.find({
        _id: { $in: attachmentIds },
      });

      const attachmentsById = attachments.reduce(
        (acc, curr) => {
          acc[curr.id] = curr;
          return acc;
        },
        {} as { [key: string]: WithUrl<Attachment> },
      );
      const populatedContents = elements.map((content) => {
        const attachmentField = content[attachmentFieldName];
        if (
          typeof attachmentField === 'object' &&
          'attachment_id' in attachmentField.payload
        ) {
          const attachmentId = attachmentField?.payload?.attachment_id;
          return {
            ...content,
            [attachmentFieldName]: {
              type: attachmentField.type,
              payload: {
                ...(attachmentsById[attachmentId] || attachmentField.payload),
                url: Attachment.getAttachmentUrl(
                  attachmentId,
                  attachmentsById[attachmentId].name,
                ),
              },
            },
          };
        } else {
          return content;
        }
      });
      return populatedContents;
    }
    return elements;
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
    let query: TFilterQuery<Content> = { status: true };
    const limit = options.limit;

    if (options.query) {
      query = { ...query, ...options.query };
    }
    if (typeof options.entity === 'string') {
      query = { ...query, entity: options.entity };
    }

    try {
      const total = await this.count(query);

      if (total === 0) {
        this.logger.warn('No content found', query);
        throw new Error('No content found');
      }

      try {
        const contents = await this.find(query, {
          skip,
          limit,
          sort: ['createdAt', 'desc'],
        });
        const elements = contents.map(Content.toElement);
        const attachmentFieldName = options.fields.image_url;
        if (attachmentFieldName) {
          // Populate attachment when there's an image field
          return {
            elements: await this.populateAttachments(
              elements,
              attachmentFieldName,
            ),
            pagination: {
              total,
              skip,
              limit,
            },
          };
        }
        return {
          elements,
          pagination: {
            total,
            skip,
            limit,
          },
        };
      } catch (err) {
        this.logger.error('Unable to retrieve content', err, query);
        throw err;
      }
    } catch (err) {
      this.logger.error('Unable to count content', err, query);
      throw err;
    }
  }
}
