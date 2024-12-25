/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Query,
  Session,
  StreamableFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CsrfCheck } from '@tekuconcept/nestjs-csrf';
import { Session as ExpressSession } from 'express-session';
import { diskStorage, memoryStorage } from 'multer';

import { config } from '@/config';
import { CsrfInterceptor } from '@/interceptors/csrf.interceptor';
import { LoggerService } from '@/logger/logger.service';
import { BaseController } from '@/utils/generics/base-controller';
import { DeleteResult } from '@/utils/generics/base-repository';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';
import { PageQueryPipe } from '@/utils/pagination/pagination-query.pipe';
import { PopulatePipe } from '@/utils/pipes/populate.pipe';
import { SearchFilterPipe } from '@/utils/pipes/search-filter.pipe';
import { TFilterQuery } from '@/utils/types/filter.types';

import { AttachmentDownloadDto } from '../dto/attachment.dto';
import {
  Attachment,
  AttachmentPopulate,
  AttachmentStub,
  AttachmentSubscriberFull,
  AttachmentUserFull,
  TAttachmentContextType,
} from '../schemas/attachment.schema';
import { AttachmentService } from '../services/attachment.service';
import { generateUniqueFilename } from '../utilities';

@UseInterceptors(CsrfInterceptor)
@Controller('attachment')
export class AttachmentController extends BaseController<
  Attachment,
  AttachmentStub,
  AttachmentPopulate,
  AttachmentUserFull | AttachmentSubscriberFull
> {
  constructor(
    private readonly attachmentService: AttachmentService,
    private readonly logger: LoggerService,
  ) {
    super(attachmentService);
  }

  /**
   * Counts the filtered number of attachments.
   *
   * @returns A promise that resolves to an object representing the filtered number of attachments.
   */
  @Get('count')
  async filterCount(
    @Query(
      new SearchFilterPipe<Attachment>({
        allowedFields: ['name', 'type'],
      }),
    )
    filters?: TFilterQuery<Attachment>,
  ) {
    return await this.count(filters);
  }

  /**
   * Retrieves a single attachment by its ID.
   *
   * This endpoint fetches an attachment from the database using its unique identifier.
   * If the attachment is found and the `populate` query parameter is provided,
   * it determines whether the requested population of related data is allowed and returns the populated data.
   * Otherwise, it fetches the attachment based on its owner type.
   *
   * @param id - The unique identifier of the attachment to retrieve.
   * @param populate - (Optional) An array of fields to populate in the response.
   * @returns The requested attachment, potentially populated.
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query(PopulatePipe)
    populate: string[],
  ) {
    const doc = await this.attachmentService.findOne(id);
    if (!doc) {
      this.logger.warn(`Unable to find Attachment by id ${id}`);
      throw new NotFoundException(`Attachment with ID ${id} not found`);
    }

    return this.attachmentService.canPopulate(populate)
      ? await this.attachmentService.findOneByOwnerAndPopulate(
          doc.ownerType,
          id,
        )
      : await this.attachmentService.findOneByOwner(doc.ownerType, id);
  }

  /**
   * Retrieves all attachments based on specified filters.
   *
   * @param pageQuery - The pagination to apply when retrieving attachments.
   * @param filters - The filters to apply when retrieving attachments.
   * @returns A promise that resolves to an array of attachments matching the filters.
   */
  @Get()
  async findPage(
    @Query(PageQueryPipe) pageQuery: PageQueryDto<Attachment>,
    @Query(PopulatePipe)
    populate: string[],
    @Query(
      new SearchFilterPipe<Attachment>({
        allowedFields: ['name', 'type'],
      }),
    )
    filters: TFilterQuery<Attachment>,
  ) {
    const publicAttachmentsFilter: TFilterQuery<Attachment> = {
      ...filters,
      context: {
        $in: ['block_attachment', 'content_attachment'],
      },
    };
    return this.canPopulate(populate)
      ? await this.attachmentService.findAndPopulate(
          publicAttachmentsFilter,
          pageQuery,
        )
      : await this.attachmentService.find(publicAttachmentsFilter, pageQuery);
  }

  /**
   * Uploads files to the server.
   *
   * @param files - An array of files to upload.
   * @returns A promise that resolves to an array of uploaded attachments.
   */
  @CsrfCheck(true)
  @Post('upload')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'file' }], {
      limits: {
        fileSize: config.parameters.maxUploadSize,
      },
      storage: (() => {
        if (config.parameters.storageMode === 'memory') {
          return memoryStorage();
        } else {
          return diskStorage({
            destination: config.parameters.uploadDir,
            filename: (_req, file, cb) => {
              cb(null, generateUniqueFilename(file.originalname));
            },
          });
        }
      })(),
    }),
  )
  async uploadFile(
    @UploadedFiles() files: { file: Express.Multer.File[] },
    @Query() { context }: { context?: TAttachmentContextType },
    @Session() session?: ExpressSession,
  ) {
    if (!files || !Array.isArray(files?.file) || files.file.length === 0) {
      throw new BadRequestException('No file was selected');
    }

    const ownerId = session?.passport?.user?.id;

    if (!ownerId) {
      throw new BadRequestException(
        'Must be logged-in to be able to upload a file.',
      );
    }

    return await this.attachmentService.uploadFiles({
      files: files.file,
      ownerId,
      context,
      ownerType: 'User',
    });
  }

  /**
   * Downloads an attachment identified by the provided parameters.
   *
   * @param  params - The parameters identifying the attachment to download.
   * @returns A promise that resolves to a StreamableFile representing the downloaded attachment.
   */
  @Get('download/:id/:filename?')
  async download(
    @Param() params: AttachmentDownloadDto,
  ): Promise<StreamableFile> {
    const attachment = await this.attachmentService.findOne(params.id);

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    return await this.attachmentService.download(attachment);
  }

  /**
   * Deletes an attachment with the specified ID.
   *
   * @param id - The ID of the attachment to delete.
   * @returns A promise that resolves to the result of the deletion operation.
   */
  @CsrfCheck(true)
  @Delete(':id')
  @HttpCode(204)
  async deleteOne(@Param('id') id: string): Promise<DeleteResult> {
    const result = await this.attachmentService.deleteOne(id);
    if (result.deletedCount === 0) {
      this.logger.warn(`Unable to delete attachment by id ${id}`);
      throw new NotFoundException(`Attachment with ID ${id} not found`);
    }
    return result;
  }
}
