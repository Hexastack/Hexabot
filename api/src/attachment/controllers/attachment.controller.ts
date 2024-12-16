/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { extname } from 'path';

import {
  BadRequestException,
  Body,
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
import { v4 as uuidv4 } from 'uuid';

import { config } from '@/config';
import { CsrfInterceptor } from '@/interceptors/csrf.interceptor';
import { LoggerService } from '@/logger/logger.service';
import { TRole } from '@/user/schemas/role.schema';
import { UserService } from '@/user/services/user.service';
import { Roles } from '@/utils/decorators/roles.decorator';
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
  AttachmentFull,
  AttachmentPopulate,
  AttachmentStub,
  TContextType,
} from '../schemas/attachment.schema';
import { AttachmentService } from '../services/attachment.service';

@UseInterceptors(CsrfInterceptor)
@Controller('attachment')
export class AttachmentController extends BaseController<
  Attachment,
  AttachmentStub,
  AttachmentPopulate,
  AttachmentFull
> {
  constructor(
    private readonly attachmentService: AttachmentService,
    private readonly logger: LoggerService,
    private readonly userService: UserService,
  ) {
    super(attachmentService);
  }

  private hasRequiredAccessRole = async (
    sessionId?: string,
    allowedRoles: TRole[] = ['admin'],
  ): Promise<boolean> => {
    const user = await this.userService.findOneAndPopulate({
      _id: sessionId,
    });
    const hasRequiredAccessRole = user?.roles?.some(({ name }) =>
      allowedRoles.map((allowedRole) => allowedRole.toString()).includes(name),
    );

    return hasRequiredAccessRole;
  };

  async hasAttachmentAccess(
    attachment: Attachment,
    sessionId?: string,
    allowedRoles: TRole[] = ['admin'],
  ): Promise<boolean> {
    const isOwner = sessionId === attachment?.owner;

    // gives access to the Attachment owner
    if (sessionId && isOwner) {
      return true;
    }

    const hasRequiredAccessRole = await this.hasRequiredAccessRole(
      sessionId,
      allowedRoles,
    );

    // gives access to the user having one of the required role(s)
    if (sessionId && hasRequiredAccessRole) {
      return true;
    }

    // else restrict access
    return false;
  }

  /**
   * Returns the query filters for attachments.
   *
   @returns A promise that resolves to an object representing the TFilterQuery filtered of attachments.
   */
  private async getAttachmentsFilters(
    filters: TFilterQuery<Attachment>,
    sessionId?: string,
    allowedRoles: TRole[] = ['admin'],
  ): Promise<TFilterQuery<Attachment>> {
    const hasRequiredAccessRole = await this.hasRequiredAccessRole(
      sessionId,
      allowedRoles,
    );

    return hasRequiredAccessRole ? filters : { ...filters, owner: sessionId };
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
        allowedFields: ['name', 'type', 'context'],
      }),
    )
    filters?: TFilterQuery<Attachment>,
  ) {
    return await this.count(filters);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Session() session?: ExpressSession,
  ): Promise<Attachment> {
    const doc = await this.attachmentService.findOne(id);
    if (!doc) {
      this.logger.warn(`Unable to find Attachment by id ${id}`);
      throw new NotFoundException(`Attachment with ID ${id} not found`);
    }

    if (
      !(await this.hasAttachmentAccess(doc, session?.passport?.user?.id, [
        'registered',
      ]))
    ) {
      throw new BadRequestException('You cannot access this Attachment');
    }

    return doc;
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
        allowedFields: ['name', 'type', 'context'],
      }),
    )
    filters: TFilterQuery<Attachment>,
    @Session() session?: ExpressSession,
  ) {
    const accessFilters = await this.getAttachmentsFilters(
      filters,
      session.passport.user.id,
      ['admin'],
    );
    return this.canPopulate(populate)
      ? await this.attachmentService.findAndPopulate(accessFilters, pageQuery)
      : await this.attachmentService.find(accessFilters, pageQuery);
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
            filename: (req, file, cb) => {
              const name = file.originalname.split('.')[0];
              const extension = extname(file.originalname);
              cb(null, `${name}-${uuidv4()}${extension}`);
            },
          });
        }
      })(),
    }),
  )
  async uploadFile(
    @UploadedFiles() files: { file: Express.Multer.File[] },
    @Body() { context }: { context?: TContextType },
    @Session() session?: ExpressSession,
  ): Promise<Attachment[]> {
    if (!files || !Array.isArray(files?.file) || files.file.length === 0) {
      throw new BadRequestException('No file was selected');
    }

    const ownerId = session?.passport?.user?.id;

    return await this.attachmentService.uploadFiles({
      files: files.file,
      ownerId,
      context,
    });
  }

  /**
   * Downloads an attachment identified by the provided parameters.
   *
   * @param  params - The parameters identifying the attachment to download.
   * @returns A promise that resolves to a StreamableFile representing the downloaded attachment.
   */
  @Roles('public')
  @Get('download/:id/:filename?')
  async download(
    @Param() params: AttachmentDownloadDto,
    @Session() session?: ExpressSession,
  ): Promise<StreamableFile> {
    const attachment = await this.attachmentService.findOne(params.id);

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    if (
      !(await this.hasAttachmentAccess(
        attachment,
        session?.passport?.user?.id,
        ['admin'],
      ))
    ) {
      throw new BadRequestException('You cannot access this Attachment');
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
