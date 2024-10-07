/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { LoggerService } from '@/logger/logger.service';
import { SettingService } from '@/setting/services/setting.service';

import { NlpEntityService } from './nlp-entity.service';
import { NlpSampleService } from './nlp-sample.service';
import { NlpValueService } from './nlp-value.service';
import BaseNlpHelper from '../lib/BaseNlpHelper';
import { NlpEntity } from '../schemas/nlp-entity.schema';
import { NlpValue } from '../schemas/nlp-value.schema';

@Injectable()
export class NlpService {
  private registry: Map<string, BaseNlpHelper> = new Map();

  private nlp: BaseNlpHelper;

  constructor(
    private readonly settingService: SettingService,
    private readonly logger: LoggerService,
    protected readonly nlpSampleService: NlpSampleService,
    protected readonly nlpEntityService: NlpEntityService,
    protected readonly nlpValueService: NlpValueService,
  ) {
    this.initNLP();
  }

  /**
   * Registers a helper with a specific name in the registry.
   *
   * @param name - The name of the helper to register.
   * @param helper - The NLP helper to be associated with the given name.
   * @typeParam C - The type of the helper, which must extend `BaseNlpHelper`.
   */
  public setHelper<C extends BaseNlpHelper>(name: string, helper: C) {
    this.registry.set(name, helper);
  }

  /**
   * Retrieves all registered helpers.
   *
   * @returns An array of all helpers currently registered.
   */
  public getAll() {
    return Array.from(this.registry.values());
  }

  /**
   * Retrieves the appropriate helper based on the helper name.
   *
   * @param helperName - The name of the helper (messenger, offline, ...).
   *
   * @returns The specified helper.
   */
  public getHelper<C extends BaseNlpHelper>(name: string): C {
    const handler = this.registry.get(name);
    if (!handler) {
      throw new Error(`NLP Helper ${name} not found`);
    }
    return handler as C;
  }

  async initNLP() {
    try {
      const settings = await this.settingService.getSettings();
      const nlpSettings = settings.nlp_settings;
      const helper = this.getHelper(nlpSettings.provider);

      if (helper) {
        this.nlp = helper;
        this.nlp.setSettings(nlpSettings);
      } else {
        throw new Error(`Undefined NLP Helper ${nlpSettings.provider}`);
      }
    } catch (e) {
      this.logger.error('NLP Service : Unable to instantiate NLP Helper !', e);
      // throw e;
    }
  }

  /**
   * Retrieves the currently active NLP helper.
   *
   * @returns The current NLP helper.
   */
  getNLP() {
    return this.nlp;
  }

  /**
   * Handles the event triggered when NLP settings are updated. Re-initializes the NLP service.
   */
  @OnEvent('hook:nlp:settings')
  async handleSettingsUpdate() {
    this.initNLP();
  }

  /**
   * Handles the event triggered when a new NLP entity is created. Synchronizes the entity with the external NLP provider.
   *
   * @param entity - The NLP entity to be created.
   * @returns The updated entity after synchronization.
   */
  @OnEvent('hook:nlpEntity:create')
  async handleEntityCreate(entity: NlpEntity) {
    // Synchonize new entity with NLP
    try {
      const foreignId = await this.getNLP().addEntity(entity);
      this.logger.debug('New entity successfully synced!', foreignId);
      return await this.nlpEntityService.updateOne(entity.id, {
        foreign_id: foreignId,
      });
    } catch (err) {
      this.logger.error('Unable to sync a new entity', err);
      return entity;
    }
  }

  /**
   * Handles the event triggered when an NLP entity is updated. Synchronizes the updated entity with the external NLP provider.
   *
   * @param entity - The NLP entity to be updated.
   */
  @OnEvent('hook:nlpEntity:update')
  async handleEntityUpdate(entity: NlpEntity) {
    // Synchonize new entity with NLP provider
    try {
      await this.getNLP().updateEntity(entity);
      this.logger.debug('Updated entity successfully synced!', entity);
    } catch (err) {
      this.logger.error('Unable to sync updated entity', err);
    }
  }

  /**
   * Handles the event triggered when an NLP entity is deleted. Synchronizes the deletion with the external NLP provider.
   *
   * @param entity - The NLP entity to be deleted.
   */
  @OnEvent('hook:nlpEntity:delete')
  async handleEntityDelete(entity: NlpEntity) {
    // Synchonize new entity with NLP provider
    try {
      await this.getNLP().deleteEntity(entity.foreign_id);
      this.logger.debug('Deleted entity successfully synced!', entity);
    } catch (err) {
      this.logger.error('Unable to sync deleted entity', err);
    }
  }

  /**
   * Handles the event triggered when a new NLP value is created. Synchronizes the value with the external NLP provider.
   *
   * @param value - The NLP value to be created.
   *
   * @returns The updated value after synchronization.
   */
  @OnEvent('hook:nlpValue:create')
  async handleValueCreate(value: NlpValue) {
    // Synchonize new value with NLP provider
    try {
      const foreignId = await this.getNLP().addValue(value);
      this.logger.debug('New value successfully synced!', foreignId);
      return await this.nlpValueService.updateOne(value.id, {
        foreign_id: foreignId,
      });
    } catch (err) {
      this.logger.error('Unable to sync a new value', err);
      return value;
    }
  }

  /**
   * Handles the event triggered when an NLP value is updated. Synchronizes the updated value with the external NLP provider.
   *
   * @param value - The NLP value to be updated.
   */
  @OnEvent('hook:nlpValue:update')
  async handleValueUpdate(value: NlpValue) {
    // Synchonize new value with NLP provider
    try {
      await this.getNLP().updateValue(value);
      this.logger.debug('Updated value successfully synced!', value);
    } catch (err) {
      this.logger.error('Unable to sync updated value', err);
    }
  }

  /**
   * Handles the event triggered when an NLP value is deleted. Synchronizes the deletion with the external NLP provider.
   *
   * @param value - The NLP value to be deleted.
   */
  @OnEvent('hook:nlpValue:delete')
  async handleValueDelete(value: NlpValue) {
    // Synchonize new value with NLP provider
    try {
      const populatedValue = await this.nlpValueService.findOneAndPopulate(
        value.id,
      );
      await this.getNLP().deleteValue(populatedValue);
      this.logger.debug('Deleted value successfully synced!', value);
    } catch (err) {
      this.logger.error('Unable to sync deleted value', err);
    }
  }
}
