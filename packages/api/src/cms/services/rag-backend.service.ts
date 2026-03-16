/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import path from 'path';

import { KeywordTable } from '@llamaindex/core/data-structs';
import { Settings } from '@llamaindex/core/global';
import { OpenAIEmbedding } from '@llamaindex/openai';
import {
  PGVectorStore,
  PostgresDocumentStore,
  PostgresIndexStore,
} from '@llamaindex/postgres';
import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  KeywordTableIndex,
  SimpleDocumentStore,
  SimpleIndexStore,
  SimpleVectorStore,
  StorageContext,
  VectorStoreIndex,
  storageContextFromDefaults,
} from 'llamaindex';

import { config } from '@/config';
import { LoggerService } from '@/logger/logger.service';
import { SettingService } from '@/setting/services/setting.service';

import {
  isKeywordTableDeserializationError,
  recoverKeywordIndexFromRawStore,
} from './rag-keyword-index-recovery';

const PGVECTOR_COLLECTION = 'cms_content';
const PGVECTOR_SCHEMA = 'public';
const PGVECTOR_TABLE = 'llamaindex_embedding';
const SQLITE_PERSIST_DIR = 'storage/content-rag';
const EMBEDDING_SQLITE_SUBDIR = 'embedding';
const LEXICAL_SQLITE_SUBDIR = 'lexical';
const LEXICAL_NAMESPACE_PREFIX = 'cms_content_lexical';
const LEXICAL_RETRIEVER = 'simple';

type RagSettings = Settings['rag_settings'];
type PostgresClientConfig =
  | { connectionString: string }
  | {
      host: string;
      port: number;
      user: string;
      password: string;
      database: string;
    };

@Injectable()
export class RagBackendService implements OnModuleInit {
  private embeddingIndex?: VectorStoreIndex;

  private lexicalIndex?: KeywordTableIndex;

  private embeddingBackendInitPromise?: Promise<void>;

  private lexicalBackendInitPromise?: Promise<void>;

  constructor(
    private readonly settingService: SettingService,
    private readonly logger: LoggerService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.warmUpBackend(
      () => this.ensureEmbeddingBackend(),
      'Unable to initialize RAG embedding backend during module startup. It will retry on demand.',
    );
    await this.warmUpBackend(
      () => this.ensureLexicalBackend(),
      'Unable to initialize RAG lexical backend during module startup. It will retry on demand.',
    );
  }

  async getEmbeddingIndex(): Promise<VectorStoreIndex> {
    await this.ensureEmbeddingBackend();

    if (!this.embeddingIndex) {
      throw new Error('Unable to initialize RAG embedding index.');
    }

    return this.embeddingIndex;
  }

  async getLexicalIndex(): Promise<KeywordTableIndex> {
    await this.ensureLexicalBackend();

    return this.getLexicalIndexOrThrow();
  }

  async areLexicalIndexEmpty(): Promise<boolean> {
    const index = await this.getLexicalIndex();
    const allRefDocInfo = await index.docStore.getAllRefDocInfo();
    if (allRefDocInfo && Object.keys(allRefDocInfo).length > 0) {
      return false;
    }

    if (index.indexStruct.table.size > 0) {
      return false;
    }

    return true;
  }

  reset(): void {
    this.embeddingIndex = undefined;
    this.lexicalIndex = undefined;
    this.embeddingBackendInitPromise = undefined;
    this.lexicalBackendInitPromise = undefined;
  }

  private getLexicalIndexOrThrow(): KeywordTableIndex {
    if (!this.lexicalIndex) {
      throw new Error('Unable to initialize lexical keyword index.');
    }

    return this.lexicalIndex;
  }

  private async warmUpBackend(
    initializer: () => Promise<void>,
    warningMessage: string,
  ): Promise<void> {
    try {
      await initializer();
    } catch (error) {
      this.logger.warn(warningMessage, error);
    }
  }

  private async ensureEmbeddingBackend(): Promise<void> {
    if (this.embeddingIndex) {
      return;
    }

    if (!this.embeddingBackendInitPromise) {
      this.embeddingBackendInitPromise =
        this.initializeEmbeddingBackend().catch((error) => {
          this.embeddingBackendInitPromise = undefined;
          throw error;
        });
    }

    await this.embeddingBackendInitPromise;
  }

  private async initializeEmbeddingBackend(): Promise<void> {
    const ragSettings = await this.getEnabledRagSettings();
    if (!ragSettings) {
      return;
    }
    this.validateEmbeddingSettings(ragSettings);
    const embedModel = this.createEmbeddingModel(ragSettings);

    await Settings.withEmbedModel(embedModel, async () => {
      const storageContext = await this.createEmbeddingStorageContext(
        ragSettings,
        embedModel,
      );
      this.embeddingIndex = await VectorStoreIndex.init({
        nodes: [],
        storageContext,
      });
    });
  }

  private async ensureLexicalBackend(): Promise<void> {
    if (this.lexicalIndex) {
      return;
    }

    if (!this.lexicalBackendInitPromise) {
      this.lexicalBackendInitPromise = this.initializeLexicalBackend().catch(
        (error) => {
          this.lexicalBackendInitPromise = undefined;
          throw error;
        },
      );
    }

    await this.lexicalBackendInitPromise;
  }

  private async initializeLexicalBackend(): Promise<void> {
    const ragSettings = await this.getEnabledRagSettings();
    if (!ragSettings) {
      return;
    }

    this.lexicalIndex = await this.createKeywordIndex();
  }

  private async createKeywordIndex(): Promise<KeywordTableIndex> {
    if (config.database.type === 'sqlite') {
      const storageContext = await this.createSqliteLexicalStorageContext();

      return this.initKeywordIndex(storageContext);
    }

    if (config.database.type === 'postgres') {
      const storageContext = await this.createPostgresLexicalStorageContext();

      return this.initKeywordIndex(storageContext);
    }

    throw new Error(
      `Unsupported database "${config.database.type}" for lexical retrieval.`,
    );
  }

  private async getEnabledRagSettings(): Promise<RagSettings | null> {
    const settings = await this.settingService.getSettings();
    if (!settings.rag_settings.enabled) {
      return null;
    }

    return settings.rag_settings;
  }

  private validateEmbeddingSettings(ragSettings: RagSettings): void {
    if (!ragSettings.embedding_provider) {
      throw new Error(
        `Unsupported embedding provider "${ragSettings.embedding_provider}".`,
      );
    }

    if (!ragSettings.embedding_api_key) {
      throw new Error(
        'Missing RAG embedding API key. Set rag_settings.embedding_api_key.',
      );
    }
  }

  private createEmbeddingModel(ragSettings: RagSettings): OpenAIEmbedding {
    return new OpenAIEmbedding({
      model: ragSettings.embedding_model,
      apiKey: ragSettings.embedding_api_key,
      ...(ragSettings.embedding_base_url
        ? { baseURL: ragSettings.embedding_base_url }
        : {}),
      ...(ragSettings.embedding_dimensions > 0
        ? { dimensions: ragSettings.embedding_dimensions }
        : {}),
    });
  }

  private async createEmbeddingStorageContext(
    ragSettings: RagSettings,
    embedModel: OpenAIEmbedding,
  ): Promise<StorageContext> {
    if (config.database.type === 'sqlite') {
      return await this.createSqliteEmbeddingStorageContext(embedModel);
    }

    if (config.database.type === 'postgres') {
      return await this.createPostgresEmbeddingStorageContext(
        ragSettings.embedding_dimensions,
        embedModel,
      );
    }

    throw new Error(
      `Unsupported database "${config.database.type}" for embedding retrieval.`,
    );
  }

  private async createSqliteEmbeddingStorageContext(
    embedModel: OpenAIEmbedding,
  ): Promise<StorageContext> {
    const persistDir = this.resolveSqlitePersistDir(EMBEDDING_SQLITE_SUBDIR);
    const vectorStore = await SimpleVectorStore.fromPersistDir(
      persistDir,
      embedModel,
    );

    return await storageContextFromDefaults({
      persistDir,
      vectorStore,
    });
  }

  private async createPostgresEmbeddingStorageContext(
    dimensions: number,
    embedModel: OpenAIEmbedding,
  ): Promise<StorageContext> {
    const clientConfig = this.resolvePostgresClientConfig();
    const vectorStore = new PGVectorStore({
      clientConfig,
      schemaName: PGVECTOR_SCHEMA,
      tableName: PGVECTOR_TABLE,
      dimensions,
      performSetup: true,
      embedModel,
    });
    vectorStore.setCollection(PGVECTOR_COLLECTION);
    const docStore = new PostgresDocumentStore({
      clientConfig,
      schemaName: PGVECTOR_SCHEMA,
      namespace: PGVECTOR_COLLECTION,
    });
    const indexStore = new PostgresIndexStore({
      clientConfig,
      schemaName: PGVECTOR_SCHEMA,
      namespace: PGVECTOR_COLLECTION,
    });

    return await storageContextFromDefaults({
      vectorStore,
      docStore,
      indexStore,
    });
  }

  private async createSqliteLexicalStorageContext(): Promise<StorageContext> {
    const persistDir = this.resolveSqlitePersistDir(LEXICAL_SQLITE_SUBDIR);
    const docStore = await SimpleDocumentStore.fromPersistDir(persistDir);
    const indexStore = await SimpleIndexStore.fromPersistDir(persistDir);

    return this.createLexicalStorageContext({
      docStore,
      indexStore,
    });
  }

  private async createPostgresLexicalStorageContext(): Promise<StorageContext> {
    const clientConfig = this.resolvePostgresClientConfig();
    const namespace = `${LEXICAL_NAMESPACE_PREFIX}_${LEXICAL_RETRIEVER}`;
    const docStore = new PostgresDocumentStore({
      clientConfig,
      schemaName: PGVECTOR_SCHEMA,
      namespace,
    });
    const indexStore = new PostgresIndexStore({
      clientConfig,
      schemaName: PGVECTOR_SCHEMA,
      namespace,
    });

    return this.createLexicalStorageContext({
      docStore,
      indexStore,
    });
  }

  private createLexicalStorageContext(params: {
    docStore: StorageContext['docStore'];
    indexStore: StorageContext['indexStore'];
  }): StorageContext {
    return {
      docStore: params.docStore,
      indexStore: params.indexStore,
      // Lexical indexing does not require a vector store.
      vectorStores: {},
    };
  }

  private resolveSqlitePersistDir(...segments: string[]): string {
    return path.join(process.cwd(), SQLITE_PERSIST_DIR, ...segments);
  }

  private async initKeywordIndex(
    storageContext: StorageContext,
  ): Promise<KeywordTableIndex> {
    let indexStructs: Awaited<
      ReturnType<StorageContext['indexStore']['getIndexStructs']>
    >;
    try {
      indexStructs = await storageContext.indexStore.getIndexStructs();
    } catch (error) {
      if (isKeywordTableDeserializationError(error)) {
        const recoveredIndex =
          await recoverKeywordIndexFromRawStore(storageContext);
        if (recoveredIndex) {
          return recoveredIndex;
        }
      }

      throw error;
    }

    if (indexStructs.length === 0) {
      return await KeywordTableIndex.init({
        storageContext,
        indexStruct: new KeywordTable(),
      });
    }

    if (indexStructs.length === 1) {
      return await KeywordTableIndex.init({
        storageContext,
      });
    }

    throw new Error(
      'Unable to initialize lexical keyword index: multiple index structs found in lexical storage.',
    );
  }

  private resolvePostgresClientConfig(): PostgresClientConfig {
    const db = config.database;

    if (db.url) {
      return { connectionString: db.url };
    }

    if (!db.host || !db.username || !db.password || !db.database) {
      throw new Error(
        'Missing PostgreSQL connection details for RAG backend initialization.',
      );
    }

    return {
      host: db.host,
      port: db.port ?? 5432,
      user: db.username,
      password: db.password,
      database: db.database,
    };
  }
}
