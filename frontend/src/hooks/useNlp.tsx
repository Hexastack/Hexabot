/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useMemo } from "react";

import { EntityType, Format } from "@/services/types";
import { INlpEntity, Lookup } from "@/types/nlp-entity.types";

import { useFind } from "./crud/useFind";

const buildNlpEntityMap = (entities: INlpEntity[], lookup: Lookup) => {
  const intialMap = new Map<string, INlpEntity>();
  
  return entities
    .filter(({ lookups }) => {
      return lookups.includes(lookup);
    }).reduce((acc, curr) => {
      acc.set(curr.name, curr);
      
      return acc;
    }, intialMap)
}

export const useNlp = () => {
    const { data: allEntities, refetch: refetchAllEntities } = useFind(
      {
        entity: EntityType.NLP_ENTITY,
        format: Format.FULL,
      },
      {
        hasCount: false,
      },
    );
    const allTraitEntities = useMemo(() => {
      return buildNlpEntityMap((allEntities || []), 'trait')
    }, [allEntities]);
    const allKeywordEntities = useMemo(() => {
      return buildNlpEntityMap((allEntities || []), 'keywords')
    }, [allEntities]);
    const allPatternEntities = useMemo(() => {
      return buildNlpEntityMap((allEntities || []), 'pattern')
    }, [allEntities]);

    return {
      allTraitEntities,
      allKeywordEntities,
      allPatternEntities,
      refetchAllEntities
    }
};
