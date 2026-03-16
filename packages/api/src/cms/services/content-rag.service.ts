/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InsertEvent, RemoveEvent, UpdateEvent } from 'typeorm';

import { LoggerService } from '@/logger/logger.service';
import { SettingService } from '@/setting/services/setting.service';

import { ContentOrmEntity } from '../entities/content.entity';
import { ContentRagHit, ContentRagQueryOptions } from '../types/rag';

import { ContentRagIndexerService } from './content-rag-indexer.service';
import { ContentRagRetrieverService } from './content-rag-retriever.service';
import { RagBackendService } from './rag-backend.service';

@Injectable()
export class ContentRagService {
  private ragSettingsReindexPromise?: Promise<void>;

  private manualReindexPromise?: Promise<void>;

  constructor(
    private readonly retrieverService: ContentRagRetrieverService,
    private readonly indexerService: ContentRagIndexerService,
    private readonly embeddingBackendService: RagBackendService,
    private readonly settingService: SettingService,
    private readonly logger: LoggerService,
  ) {}

  async retrieve(
    query: string,
    options: ContentRagQueryOptions = {},
  ): Promise<ContentRagHit[]> {
    return await this.retrieverService.retrieve(query, options);
  }

  async upsertContentIndex(contentId: string): Promise<void> {
    await this.indexerService.upsertContentIndex(contentId);
  }

  async removeContentIndex(contentId: string): Promise<void> {
    await this.indexerService.removeContentIndex(contentId);
  }

  async reindexAll(): Promise<void> {
    await this.indexerService.reindexAll();
  }

  scheduleReindexAll(): void {
    if (!this.manualReindexPromise) {
      this.manualReindexPromise = this.reindexAll()
        .catch((error) => {
          this.logger.error(
            'Unable to complete manual RAG reindex request.',
            error,
          );
        })
        .finally(() => {
          this.manualReindexPromise = undefined;
        });
    }
  }

  @OnEvent('hook:rag_settings:enabled')
  async handleRagEnabledSettingChanged(): Promise<void> {
    await this.reindexAfterRagSettingChange('enabled');
  }

  @OnEvent('hook:rag_settings:embedding_model')
  @OnEvent('hook:rag_settings:embedding_provider')
  @OnEvent('hook:rag_settings:embedding_api_key')
  @OnEvent('hook:rag_settings:embedding_base_url')
  @OnEvent('hook:rag_settings:embedding_dimensions')
  @OnEvent('hook:rag_settings:index_only_active_content')
  async handleRagBackendSettingChanged(): Promise<void> {
    await this.reindexAfterRagSettingChange('backend');
  }

  @OnEvent('hook:content:postCreate')
  async handleContentCreated(
    event: InsertEvent<ContentOrmEntity>,
  ): Promise<void> {
    const contentId = event.entity?.id;
    if (!contentId) {
      return;
    }

    try {
      await this.upsertContentIndex(contentId);
    } catch (error) {
      this.logger.error('Unable to index created content', error, {
        contentId,
      });
    }
  }

  @OnEvent('hook:content:postUpdate')
  async handleContentUpdated(
    event: UpdateEvent<ContentOrmEntity>,
  ): Promise<void> {
    const contentId = event.entity?.id;
    if (!contentId) {
      return;
    }

    try {
      await this.upsertContentIndex(contentId);
    } catch (error) {
      this.logger.error('Unable to index updated content', error, {
        contentId,
      });
    }
  }

  @OnEvent('hook:content:postDelete')
  async handleContentDeleted(
    event: RemoveEvent<ContentOrmEntity>,
  ): Promise<void> {
    const contentId = event.entity?.id;
    if (!contentId) {
      return;
    }

    try {
      await this.removeContentIndex(contentId);
    } catch (error) {
      this.logger.error('Unable to remove deleted content from index', error, {
        contentId,
      });
    }
  }

  private async reindexAfterRagSettingChange(trigger: string): Promise<void> {
    if (!this.ragSettingsReindexPromise) {
      this.ragSettingsReindexPromise = this.performRagSettingsReindex()
        .catch((error) => {
          this.logger.error(
            `Unable to reindex content after RAG setting change (${trigger}).`,
            error,
          );
        })
        .finally(() => {
          this.ragSettingsReindexPromise = undefined;
        });
    }

    await this.ragSettingsReindexPromise;
  }

  private async performRagSettingsReindex(): Promise<void> {
    const settings = await this.settingService.getSettings();
    if (!settings.rag_settings.enabled) {
      return;
    }

    this.embeddingBackendService.reset();
    await this.reindexAll();
  }
}
