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
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';

import { config } from '@/config';
import { I18nService } from '@/i18n/services/i18n.service';
import { LanguageService } from '@/i18n/services/language.service';
import { LoggerService } from '@/logger/logger.service';

import { UserService } from './user.service';
import { UserCreateDto } from '../dto/user.dto';

@Injectable()
export class ValidateAccountService {
  public readonly jwtSignOptions: JwtSignOptions = {
    secret: config.confirm_account.jwtOptions.secret,
    expiresIn: config.confirm_account.jwtOptions.expiresIn,
    encoding: 'utf-8',
  };

  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    private readonly userService: UserService,
    @Optional() private readonly mailerService: MailerService | undefined,
    private logger: LoggerService,
    private readonly i18n: I18nService,
    private readonly languageService: LanguageService,
  ) {}

  /**
   * Signs a JWT token containing the user's email.
   *
   * @param dto - Object containing the user's email.
   *
   * @returns A promise that resolves to the signed JWT token.
   */
  async sign(dto: { email: string }) {
    return this.jwtService.signAsync(dto, this.jwtSignOptions);
  }

  /**
   * Verifies a given JWT token.
   *
   * @param token - The JWT token to be verified.
   *
   * @returns A promise that resolves to an object containing the user's email.
   */
  async verify(token: string): Promise<{ email: string }> {
    return this.jwtService.verifyAsync(token, this.jwtSignOptions);
  }

  /**
   * Sends an account confirmation email to the user.
   *
   * The email includes a confirmation token and user's first name.
   *
   * @param dto - An object containing the user's email and first name.
   */
  async sendConfirmationEmail(
    dto: Pick<UserCreateDto, 'email' | 'first_name'>,
  ) {
    const confirmationToken = await this.sign({ email: dto.email });

    if (this.mailerService) {
      try {
        const defaultLanguage = await this.languageService.getDefaultLanguage();
        await this.mailerService.sendMail({
          to: dto.email,
          template: 'account_confirmation.mjml',
          context: {
            token: confirmationToken,
            first_name: dto.first_name,
            t: (key: string) =>
              this.i18n.t(key, { lang: defaultLanguage.code }),
          },
          subject: this.i18n.t('account_confirmation_subject'),
        });
      } catch (e) {
        this.logger.error(
          'Could not send email',
          e.message,
          e.stack,
          'ValidateAccount',
        );
        throw new InternalServerErrorException('Could not send email');
      }
    }
  }

  /**
   * Confirms a user's account by validating the provided confirmation token.
   *
   * If the token is valid, it updates the user's account state to confirmed.
   * Throws an error if the token is invalid or if any other error occurs.
   *
   * @param dto - An object containing the confirmation token.
   *
   * @returns An empty object if the account is successfully confirmed.
   */
  async confirmAccount(dto: { token: string }) {
    const decodedToken = await this.verify(dto.token).catch((e) => {
      throw new UnauthorizedException(e.message);
    });

    await this.userService.updateOne(
      { email: decodedToken.email },
      { state: true },
    );
    try {
    } catch (e) {
      throw new InternalServerErrorException('Could confirm email');
    }
    return {};
  }
}
