/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

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

export interface DatasetType {
  common_examples: CommonExample[];
  regex_features: any[];
  lookup_tables: LookupTable[];
  entity_synonyms: EntitySynonym[];
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
