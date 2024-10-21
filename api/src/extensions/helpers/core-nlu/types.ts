/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

export namespace RasaNlu {
  export interface ExampleEntity {
    entity: string;
    value: string;
    start?: number;
    end?: number;
  }

  export interface CommonExample {
    text: string;
    intent: string;
    entities: ExampleEntity[];
  }

  export interface LookupTable {
    name: string;
    elements: string[];
  }

  export interface EntitySynonym {
    value: string;
    synonyms: string[];
  }

  export interface Dataset {
    common_examples: CommonExample[];
    regex_features: any[];
    lookup_tables: LookupTable[];
    entity_synonyms: EntitySynonym[];
  }
}

export interface ParseEntity {
  entity: string; // Entity name
  value: string; // Value name
  confidence: number;
  start?: number;
  end?: number;
}

export interface ParseEntities {
  entities: ParseEntity[];
}

export interface NlpParseResultType {
  intent: {
    name: string;
    confidence: number;
  };
  language?: {
    name: string;
    confidence: number;
  };
  intent_ranking: any[];
  entities: ParseEntity[];
  text: string;
}
