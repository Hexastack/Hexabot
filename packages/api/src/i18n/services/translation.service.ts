/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { I18nService } from '@/i18n/services/i18n.service';
import { SettingService } from '@/setting/services/setting.service';
import { BaseOrmService } from '@/utils/generics/base-orm.service';
import { WorkflowService } from '@/workflow/services/workflow.service';

import {
  TranslationDtoConfig,
  TranslationTransformerDto,
} from '../dto/translation.dto';
import { TranslationOrmEntity } from '../entities/translation.entity';
import { TranslationRepository } from '../repositories/translation.repository';

@Injectable()
export class TranslationService extends BaseOrmService<
  TranslationOrmEntity,
  TranslationTransformerDto,
  TranslationDtoConfig
> {
  constructor(
    repository: TranslationRepository,
    private readonly workflowService: WorkflowService,
    private readonly settingService: SettingService,
    private readonly i18n: I18nService,
  ) {
    super(repository);
    this.resetI18nTranslations();
  }

  public async resetI18nTranslations() {
    const translations = await this.findAll();
    this.i18n.refreshDynamicTranslations(translations);
  }

  /**
   * Collect user-facing strings declared inside a workflow definition by
   * recursively traversing its content and extracting string leaves while
   * skipping structural keys (action identifiers, ids, etc).
   *
   * @param node - Arbitrary JSON node inside the workflow definition.
   */
  private collectStrings(node: unknown, keyPath: string[] = []): string[] {
    if (node == null) {
      return [];
    }

    if (typeof node === 'string') {
      const trimmed = node.trim();

      return trimmed ? [trimmed] : [];
    }

    if (Array.isArray(node)) {
      return node.flatMap((value) => this.collectStrings(value, keyPath));
    }

    if (typeof node === 'object') {
      return Object.entries(node as Record<string, unknown>).flatMap(
        ([key, value]) => {
          return this.shouldSkipKey(key)
            ? []
            : this.collectStrings(value, keyPath.concat(key));
        },
      );
    }

    return [];
  }

  /**
   * Return any available string inside workflow definitions (task inputs,
   * descriptions, etc.).
   *
   * @returns A promise of all strings available in a array
   */
  async getAllWorkflowStrings(): Promise<string[]> {
    const workflows = await this.workflowService.find({});
    const allStrings: string[] = [];

    for (const workflow of workflows) {
      if (workflow.description) {
        allStrings.push(workflow.description);
      }

      if (!workflow.definition) {
        continue;
      }

      try {
        allStrings.push(...this.collectStrings(workflow.definition));
      } catch (err) {
        this.logger.warn(
          `Unable to collect strings from workflow ${workflow.id}`,
          err,
        );
      }
    }

    return allStrings;
  }

  /**
   * Return any available strings in settings
   *
   * @returns A promise of all strings available in a array
   */
  async getSettingStrings(): Promise<string[]> {
    const translatableSettings = await this.settingService.find({
      where: { translatable: true },
    });
    const settings = await this.settingService.getSettings();

    return Object.values(settings)
      .map((group: Record<string, string | string[]>) => Object.entries(group))
      .flat()
      .filter(([l]) => {
        return translatableSettings.find(({ label }) => label === l);
      })
      .map(([, v]) => v)
      .flat();
  }

  /**
   * Updates the in-memory translations
   */
  @OnEvent('hook:translation:*')
  handleTranslationsUpdate() {
    this.resetI18nTranslations();
  }

  /**
   * Skip structural keys when extracting strings from workflow definitions.
   */
  private shouldSkipKey(key: string): boolean {
    const lowered = key.toLowerCase();

    return ['action', 'do', 'next', 'id', 'name', 'version'].includes(lowered);
  }
}
