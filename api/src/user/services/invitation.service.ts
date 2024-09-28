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
  Optional,
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';

import { config } from '@/config';
import { I18nService } from '@/i18n/services/i18n.service';
import { LanguageService } from '@/i18n/services/language.service';
import { LoggerService } from '@/logger/logger.service';
import { BaseService } from '@/utils/generics/base-service';

import { InvitationCreateDto } from '../dto/invitation.dto';
import { InvitationRepository } from '../repositories/invitation.repository';
import {
  Invitation,
  InvitationFull,
  InvitationPopulate,
} from '../schemas/invitation.schema';

@Injectable()
export class InvitationService extends BaseService<
  Invitation,
  InvitationPopulate,
  InvitationFull
> {
  constructor(
    @Inject(InvitationRepository)
    readonly repository: InvitationRepository,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Optional() private readonly mailerService: MailerService | undefined,
    private logger: LoggerService,
    protected readonly i18n: I18nService,
    public readonly languageService: LanguageService,
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
    if (this.mailerService) {
      try {
        const defaultLanguage = await this.languageService.getDefaultLanguage();
        await this.mailerService.sendMail({
          to: dto.email,
          template: 'invitation.mjml',
          context: {
            token: jwt,
            // TODO: Which language should we use?
            t: (key: string) =>
              this.i18n.t(key, { lang: defaultLanguage.code }),
          },
          subject: this.i18n.t('invitation_subject'),
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
}
