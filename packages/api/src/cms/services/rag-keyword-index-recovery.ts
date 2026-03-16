/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { KeywordTable } from '@llamaindex/core/data-structs';
import { KeywordTableIndex, StorageContext } from 'llamaindex';

type RawIndexStore = StorageContext['indexStore'] & {
  _kvStore?: {
    getAll?: (collection?: string) => Promise<Record<string, unknown>>;
  };
  _collection?: string;
};

/**
 * Temporary compatibility shim for llamaindex 0.12.1 / @llamaindex/core 0.6.22.
 * These versions can persist `keyword_table` structs but fail to deserialize them on restart,
 * so we recover the lexical index directly from the raw KV payloads.
 */
export function isKeywordTableDeserializationError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes('Unknown index struct type: keyword_table')
  );
}

export async function recoverKeywordIndexFromRawStore(
  storageContext: StorageContext,
): Promise<KeywordTableIndex | null> {
  const rawIndexStore = storageContext.indexStore as RawIndexStore;
  const kvStore = rawIndexStore._kvStore;
  if (!kvStore || typeof kvStore.getAll !== 'function') {
    return null;
  }

  const collection =
    typeof rawIndexStore._collection === 'string'
      ? rawIndexStore._collection
      : undefined;
  const payloads = await kvStore.getAll(collection);
  const indexStructPayloads = Object.values(payloads);

  if (indexStructPayloads.length === 0) {
    const emptyIndexStruct = new KeywordTable();
    await storageContext.indexStore.addIndexStruct(emptyIndexStruct);

    return createKeywordTableIndexFromStruct(storageContext, emptyIndexStruct);
  }

  if (indexStructPayloads.length > 1) {
    throw new Error(
      'Unable to initialize lexical keyword index: multiple index structs found in lexical storage.',
    );
  }

  const recoveredStruct = parseKeywordTablePayload(indexStructPayloads[0]);

  return createKeywordTableIndexFromStruct(storageContext, recoveredStruct);
}

function createKeywordTableIndexFromStruct(
  storageContext: StorageContext,
  indexStruct: KeywordTable,
): KeywordTableIndex {
  return new KeywordTableIndex({
    storageContext,
    docStore: storageContext.docStore,
    indexStore: storageContext.indexStore,
    indexStruct,
  });
}

function parseKeywordTablePayload(payload: unknown): KeywordTable {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error(
      'Unable to initialize lexical keyword index: malformed persisted index struct.',
    );
  }

  const rawPayload = payload as {
    type?: unknown;
    indexId?: unknown;
    summary?: unknown;
    table?: unknown;
  };
  if (rawPayload.type !== 'keyword_table') {
    throw new Error(
      `Unable to initialize lexical keyword index: unsupported index struct type "${String(rawPayload.type)}".`,
    );
  }

  const indexStruct = new KeywordTable(
    undefined,
    typeof rawPayload.summary === 'string' ? rawPayload.summary : undefined,
  );
  if (typeof rawPayload.indexId === 'string') {
    indexStruct.indexId = rawPayload.indexId;
  }
  if (typeof rawPayload.table === 'undefined') {
    return indexStruct;
  }

  if (
    !rawPayload.table ||
    typeof rawPayload.table !== 'object' ||
    Array.isArray(rawPayload.table)
  ) {
    throw new Error(
      'Unable to initialize lexical keyword index: malformed keyword table payload.',
    );
  }

  const table = new Map<string, Set<string>>();
  for (const [keyword, nodeIds] of Object.entries(rawPayload.table)) {
    if (!Array.isArray(nodeIds)) {
      throw new Error(
        'Unable to initialize lexical keyword index: malformed keyword table entry.',
      );
    }

    if (!nodeIds.every((nodeId) => typeof nodeId === 'string')) {
      throw new Error(
        'Unable to initialize lexical keyword index: malformed keyword node identifier.',
      );
    }

    table.set(keyword, new Set(nodeIds as string[]));
  }

  indexStruct.table = table;

  return indexStruct;
}
