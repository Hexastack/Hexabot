/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Document,
  MetadataMode,
  NodeRelationship,
} from '@llamaindex/core/schema';
import { Injectable } from '@nestjs/common';
import {
  KeywordTableIndex,
  simpleExtractKeywords,
  VectorStoreIndex,
} from 'llamaindex';
import pLimit from 'p-limit';

import { LoggerService } from '@/logger/logger.service';
import { SettingService } from '@/setting/services/setting.service';

import { ContentFull } from '../dto/content.dto';

import { ContentService } from './content.service';
import { RagBackendService } from './rag-backend.service';

@Injectable()
export class ContentRagIndexerService {
  private static readonly REINDEX_CONCURRENCY = 8;

  constructor(
    private readonly contentService: ContentService,
    private readonly settingService: SettingService,
    private readonly embeddingBackendService: RagBackendService,
    private readonly logger: LoggerService,
  ) {}

  async upsertContentIndex(contentId: string): Promise<void> {
    const ragSettings = await this.getRagSettings();
    if (!ragSettings) {
      return;
    }

    const [embeddingIndex, lexicalIndex] = await Promise.all([
      this.getEmbeddingIndexOrNull(),
      this.embeddingBackendService.getLexicalIndex(),
    ]);
    const content = await this.contentService.findOneAndPopulate(contentId);

    if (!content) {
      await this.removeContentFromIndexes(
        contentId,
        embeddingIndex,
        lexicalIndex,
      );

      return;
    }

    await this.upsertContent(
      content,
      ragSettings,
      embeddingIndex,
      lexicalIndex,
    );
  }

  async removeContentIndex(contentId: string): Promise<void> {
    const ragSettings = await this.getRagSettings();
    if (!ragSettings) {
      return;
    }

    const [embeddingIndex, lexicalIndex] = await Promise.all([
      this.getEmbeddingIndexOrNull(),
      this.embeddingBackendService.getLexicalIndex(),
    ]);

    await this.removeContentFromIndexes(
      contentId,
      embeddingIndex,
      lexicalIndex,
    );
  }

  async reindexAll(): Promise<void> {
    const settings = await this.getRagSettings();
    if (!settings) {
      return;
    }

    const [embeddingIndex, lexicalIndex] = await Promise.all([
      this.getEmbeddingIndexOrNull(),
      this.embeddingBackendService.getLexicalIndex(),
    ]);
    const contents = await this.contentService.findAndPopulate({
      ...(settings.index_only_active_content
        ? { where: { status: true } }
        : {}),
      order: { createdAt: 'DESC' },
    });
    const concurrencyLimit = pLimit(
      ContentRagIndexerService.REINDEX_CONCURRENCY,
    );
    const failedContentIds: string[] = [];
    const results = await Promise.allSettled(
      contents.map((content) =>
        concurrencyLimit(() =>
          this.upsertContent(content, settings, embeddingIndex, lexicalIndex),
        ),
      ),
    );

    for (const [resultIndex, result] of results.entries()) {
      if (result.status === 'fulfilled') {
        continue;
      }

      const contentId = contents[resultIndex]?.id ?? 'unknown';
      failedContentIds.push(contentId);
      this.logger.error(
        'Unable to reindex content in RAG batch',
        result.reason,
        {
          contentId,
        },
      );
    }

    if (failedContentIds.length > 0) {
      throw new Error(
        `RAG reindex completed with ${failedContentIds.length} failed content item(s).`,
      );
    }
  }

  private async upsertContent(
    content: ContentFull,
    settings: Settings['rag_settings'],
    embeddingIndex: VectorStoreIndex | null,
    lexicalIndex: KeywordTableIndex,
  ): Promise<void> {
    if (settings.index_only_active_content && !content.status) {
      await this.removeContentFromIndexes(
        content.id,
        embeddingIndex,
        lexicalIndex,
      );

      return;
    }

    const document = this.toDocument(content);

    if (embeddingIndex) {
      await this.upsertContentInEmbeddingIndex(
        content.id,
        document,
        embeddingIndex,
      );
    }

    await this.upsertContentInLexicalIndex(content.id, document, lexicalIndex);
  }

  private async upsertContentInEmbeddingIndex(
    contentId: string,
    document: Document,
    embeddingIndex: VectorStoreIndex,
  ): Promise<void> {
    const existingHash =
      await embeddingIndex.docStore.getDocumentHash(contentId);
    if (existingHash === document.hash) {
      return;
    }

    if (typeof existingHash !== 'undefined') {
      await embeddingIndex.deleteRefDoc(contentId);
    }

    await embeddingIndex.insertNodes([document]);
    await embeddingIndex.docStore.setDocumentHash(contentId, document.hash);
  }

  private async upsertContentInLexicalIndex(
    contentId: string,
    document: Document,
    lexicalIndex: KeywordTableIndex,
  ): Promise<void> {
    const existingHash = await lexicalIndex.docStore.getDocumentHash(contentId);
    if (existingHash === document.hash) {
      return;
    }

    if (typeof existingHash !== 'undefined') {
      await lexicalIndex.deleteRefDoc(contentId, true);
    }

    await lexicalIndex.docStore.addDocuments([document], true);

    const keywords = this.extractKeywords(
      document.getContent(MetadataMode.NONE),
    );
    if (keywords.length > 0) {
      lexicalIndex.indexStruct.addNode(keywords, document.id_);
    }
    await lexicalIndex.indexStore?.addIndexStruct(lexicalIndex.indexStruct);
  }

  private extractKeywords(text: string): string[] {
    return [...simpleExtractKeywords(text)];
  }

  private async removeContentFromIndexes(
    contentId: string,
    embeddingIndex: VectorStoreIndex | null,
    lexicalIndex: KeywordTableIndex,
  ): Promise<void> {
    if (embeddingIndex) {
      await embeddingIndex.deleteRefDoc(contentId);
    }

    await lexicalIndex.deleteRefDoc(contentId, true);
  }

  private toDocument(content: ContentFull): Document {
    return new Document({
      id_: content.id,
      text: content.searchText ?? '',
      metadata: {
        contentId: content.id,
        title: content.title,
        contentTypeId: content.contentType.id,
        status: content.status ? 1 : 0,
      },
      relationships: {
        [NodeRelationship.SOURCE]: {
          nodeId: content.id,
          metadata: {
            contentId: content.id,
          },
        },
      },
    });
  }

  private async getEmbeddingIndexOrNull(): Promise<VectorStoreIndex | null> {
    try {
      return await this.embeddingBackendService.getEmbeddingIndex();
    } catch (error) {
      this.logger.warn(
        'Unable to initialize embedding index. Continuing lexical indexing only.',
        error,
      );

      return null;
    }
  }

  private async getRagSettings(): Promise<Settings['rag_settings'] | null> {
    const settings = await this.settingService.getSettings();
    const ragSettings = settings.rag_settings;
    if (!ragSettings.enabled) {
      return null;
    }

    return ragSettings;
  }
}
