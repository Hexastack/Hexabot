/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Settings } from '@llamaindex/core/global';
import { MetadataMode } from '@llamaindex/core/schema';
import {
  FilterCondition,
  FilterOperator,
  MetadataFilters,
} from '@llamaindex/core/vector-store';
import { Injectable } from '@nestjs/common';
import { KeywordTableRetrieverMode } from 'llamaindex';

import { SettingService } from '@/setting/services/setting.service';

import {
  ContentRagHit,
  ContentRagMode,
  ContentRagQueryOptions,
} from '../types/rag';

import { RagBackendService } from './rag-backend.service';

type ResolvedContentRagQueryOptions = Omit<ContentRagQueryOptions, 'limit'> & {
  limit: number;
};

type ContentRagCandidateHit = ContentRagHit & { _status: number };

type RetrieverEntry = {
  node: {
    id_: string;
    metadata: Record<string, unknown>;
    getContent(mode: MetadataMode): string;
  };
  score?: number;
};

@Injectable()
export class ContentRagRetrieverService {
  constructor(
    private readonly settingService: SettingService,
    private readonly ragBackendService: RagBackendService,
  ) {}

  async retrieve(
    query: string,
    options: ContentRagQueryOptions = {},
  ): Promise<ContentRagHit[]> {
    const settings = await this.settingService.getSettings();
    const ragSettings = settings.rag_settings;
    if (!ragSettings.enabled || !query?.trim()) {
      return [];
    }

    const resolvedOptions = this.resolveQueryOptions(options, ragSettings);
    if (resolvedOptions.mode !== 'embedding') {
      return await this.retrieveLexical(query, resolvedOptions);
    }

    return await this.retrieveEmbedding(query, resolvedOptions);
  }

  private async retrieveLexical(
    query: string,
    options: ResolvedContentRagQueryOptions,
  ): Promise<ContentRagHit[]> {
    const index = await this.ragBackendService.getLexicalIndex();
    const entries = await Settings.withLLM({} as any, async () => {
      const retriever = index.asRetriever({
        mode: KeywordTableRetrieverMode.SIMPLE,
        numChunksPerQuery: options.limit,
      });

      return (await retriever.retrieve(query)) as RetrieverEntry[];
    });
    const filteredHits = entries
      .map((entry) => this.toCandidateHit(entry, 'lexical'))
      .filter((hit) => this.shouldIncludeHit(hit, options));

    return this.dedupeLexicalHits(filteredHits).slice(0, options.limit);
  }

  private async retrieveEmbedding(
    query: string,
    options: ResolvedContentRagQueryOptions,
  ): Promise<ContentRagHit[]> {
    const embeddingIndex = await this.ragBackendService.getEmbeddingIndex();
    const filters = this.buildEmbeddingFilters(options);
    const retriever = embeddingIndex.asRetriever({
      similarityTopK: options.limit,
      ...(filters ? { filters } : {}),
    });
    const entries = (await retriever.retrieve(query)) as RetrieverEntry[];
    const filteredHits = entries
      .map((entry) => this.toCandidateHit(entry, 'embedding'))
      .filter((hit) => this.shouldIncludeHit(hit, options));

    return this.dedupeEmbeddingHits(filteredHits).slice(0, options.limit);
  }

  private buildEmbeddingFilters(
    options: ContentRagQueryOptions,
  ): MetadataFilters | undefined {
    const filters: MetadataFilters['filters'] = [];
    const includeInactive = options.includeInactive ?? false;

    if (!includeInactive) {
      filters.push({
        key: 'status',
        value: 1,
        operator: FilterOperator.EQ,
      });
    }

    if (options.contentTypeId) {
      filters.push({
        key: 'contentTypeId',
        value: options.contentTypeId,
        operator: FilterOperator.EQ,
      });
    }

    if (filters.length === 0) {
      return undefined;
    }

    return {
      filters,
      condition: FilterCondition.AND,
    };
  }

  private resolveQueryOptions(
    options: ContentRagQueryOptions,
    ragSettings: {
      default_mode: ContentRagMode;
      top_k: number;
    },
  ): ResolvedContentRagQueryOptions {
    return {
      ...options,
      mode: options.mode ?? ragSettings.default_mode,
      limit: options.limit ?? ragSettings.top_k,
    };
  }

  private toCandidateHit(
    entry: RetrieverEntry,
    source: ContentRagMode,
  ): ContentRagCandidateHit {
    const metadata = entry.node.metadata;
    const contentId = this.parseContentId(metadata.contentId, entry.node.id_);
    const title = this.parseTitle(metadata.title, contentId);

    return {
      contentId,
      title,
      text: entry.node.getContent(MetadataMode.NONE),
      score: source === 'embedding' ? this.parseScore(entry.score) : undefined,
      contentTypeId: this.parseContentTypeId(metadata.contentTypeId),
      source,
      _status: this.parseStatus(metadata.status),
    };
  }

  private parseContentId(contentId: unknown, fallback: string): string {
    return this.isNonEmptyString(contentId) ? contentId : fallback;
  }

  private parseTitle(title: unknown, fallback: string): string {
    return this.isNonEmptyString(title) ? title : fallback;
  }

  private parseContentTypeId(contentTypeId: unknown): string | undefined {
    return this.isNonEmptyString(contentTypeId) ? contentTypeId : undefined;
  }

  private parseStatus(status: unknown): number {
    const statusValue = typeof status === 'number' ? status : Number(status);

    return Number.isFinite(statusValue) ? statusValue : 1;
  }

  private parseScore(score: unknown): number | undefined {
    return typeof score === 'number' ? score : undefined;
  }

  private shouldIncludeHit(
    hit: ContentRagCandidateHit,
    options: ContentRagQueryOptions,
  ): boolean {
    const includeInactive = options.includeInactive ?? false;
    if (!includeInactive && hit._status !== 1) {
      return false;
    }

    if (options.contentTypeId && hit.contentTypeId !== options.contentTypeId) {
      return false;
    }

    return true;
  }

  private dedupeLexicalHits(hits: ContentRagCandidateHit[]): ContentRagHit[] {
    const byContentId = new Map<string, ContentRagHit>();
    for (const hit of hits) {
      if (byContentId.has(hit.contentId)) {
        continue;
      }

      byContentId.set(hit.contentId, this.toPublicHit(hit));
    }

    return Array.from(byContentId.values());
  }

  private dedupeEmbeddingHits(hits: ContentRagCandidateHit[]): ContentRagHit[] {
    const byContentId = new Map<string, ContentRagHit>();
    for (const hit of hits) {
      const currentHit = byContentId.get(hit.contentId);
      if (!currentHit) {
        byContentId.set(hit.contentId, this.toPublicHit(hit));
        continue;
      }

      if (this.getScore(hit) > this.getScore(currentHit)) {
        byContentId.set(hit.contentId, this.toPublicHit(hit));
      }
    }

    return Array.from(byContentId.values()).sort(
      (left, right) => this.getScore(right) - this.getScore(left),
    );
  }

  private toPublicHit(hit: ContentRagCandidateHit): ContentRagHit {
    const { _status: _, ...publicHit } = hit;

    return publicHit;
  }

  private getScore(hit: Pick<ContentRagHit, 'score'>): number {
    return hit.score ?? Number.NEGATIVE_INFINITY;
  }

  private isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.length > 0;
  }
}
