/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import { TFilterQuery } from 'mongoose';

import { config } from '@/config';
import { ExtendedI18nService } from '@/extended-i18n.service';
import { LoggerService } from '@/logger/logger.service';
import { BaseService } from '@/utils/generics/base-service';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';

import { InvitationCreateDto } from '../dto/invitation.dto';
import { InvitationRepository } from '../repositories/invitation.repository';
import { Invitation } from '../schemas/invitation.schema';

@Injectable()
export class InvitationService extends BaseService<Invitation> {
  constructor(
    @Inject(InvitationRepository)
    readonly repository: InvitationRepository,
    @Inject(JwtService) private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
    private logger: LoggerService,
    protected readonly i18n: ExtendedI18nService,
  ) {
    super(repository);
  }

  public readonly jwtSignOptions: JwtSignOptions = {
    secret: config.invitation.jwtOptions.secret,
    expiresIn: config.invitation.jwtOptions.expiresIn,
    encoding: 'utf-8',
  };

  /**
   * Creates a new invitation, generates a JWT token, and sends an invitation email to the recipient.
   *
   * @param dto - The data transfer object containing invitation information.
   *
   * @returns The newly created invitation with the generated token.
   */
  async create(dto: InvitationCreateDto): Promise<Invitation> {
    const jwt = await this.sign(dto);
    try {
      await this.mailerService.sendMail({
        to: dto.email,
        template: 'invitation.mjml',
        context: {
          token: jwt,
          // TODO: Which language should we use?
          t: (key: string) => this.i18n.t(key),
        },
      });
    } catch (e) {
      this.logger.error(
        'Could not send email',
        e.message,
        e.stack,
        'InvitationService',
      );
      throw new InternalServerErrorException('Could not send email');
    }
    const newInvitation = await super.create({ ...dto, token: jwt });
    return { ...newInvitation, token: jwt };
  }

  /**
   * Signs the invitation data using the provided JWT options.
   *
   * @param dto - The invitation data to sign.
   *
   * @returns The signed JWT token.
   */
  async sign(dto: InvitationCreateDto) {
    return this.jwtService.signAsync(dto, this.jwtSignOptions);
  }

  /**
   * Verifies the JWT token and returns the decoded invitation data.
   *
   * @param token - The JWT token to verify.
   *
   * @returns The decoded invitation data.
   */
  async verify(token: string): Promise<InvitationCreateDto> {
    return this.jwtService.verifyAsync(token, this.jwtSignOptions);
  }

  /**
   * Throws an error when attempting to update an invitation.
   *
   * @throws Always throws an "Illegal Update" error.
   */
  async updateOne(..._: any): Promise<Invitation> {
    throw new Error('Illegal Update');
  }

  /**
   * Finds a single invitation by ID and populates related data.
   *
   * @param id - The ID of the invitation to find.
   *
   * @returns The invitation with populated fields.
   */
  async findOneAndPopulate(id: string) {
    return await this.repository.findOneAndPopulate(id);
  }

  /**
   * Finds and paginates invitations based on the provided filters and pagination query, with populated related data.
   *
   * @param filters - The filters to apply when finding invitations.
   * @param pageQuery - The pagination query to apply.
   *
   * @returns A list of paginated invitations with populated fields.
   */
  async findPageAndPopulate(
    filters: TFilterQuery<Invitation>,
    pageQuery: PageQueryDto<Invitation>,
  ) {
    return await this.repository.findPageAndPopulate(filters, pageQuery);
  }
}
