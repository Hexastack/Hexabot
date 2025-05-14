/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
