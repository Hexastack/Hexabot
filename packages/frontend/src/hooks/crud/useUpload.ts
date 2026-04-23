/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { AttachmentResourceRef } from "@hexabot-ai/types";

import { TMutationOptions } from "@/services/types";
import { THook } from "@/types/base.types";

import { useEntityApiClient } from "../useApiClient";

import { useNormalizeAndCache } from "./helpers";
import { useTanstackMutation } from "./useTanstack";

export const useUpload = <
  TE extends THook["entity"],
  TBasic extends THook["basic"] = THook<{ entity: TE }>["basic"],
>(
  entity: TE,
  options?: TMutationOptions<
    TBasic,
    Error,
    { file: File; resourceRef: AttachmentResourceRef },
    TBasic
  >,
) => {
  const api = useEntityApiClient(entity);
  const normalizeAndCache = useNormalizeAndCache<string>(entity);
  const { routeParams, ...otherOptions } = options || {};

  return useTanstackMutation({
    mutationFn: async ({ file, resourceRef }) => {
      const data = await api.upload(file, resourceRef, routeParams);
      const { entities, result } = normalizeAndCache(data);

      return entities[entity]?.[result] as TBasic;
    },
    ...otherOptions,
  });
};
