/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

export namespace LudwigNlu {
  export interface ExampleEntity {
    entity: string;
    value: string;
    start?: number;
    end?: number;
  }

  export interface NluProcessedResultType {
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

  export interface LudwigNluDataSample {
    text: string;
    language: string;
    intent: string;
    slots: string;
  }

  export interface LudwigNluResultType {
    slots: {
      predictions: {
        slots_predictions: string[];
        slots_probabilities: number[];
        slots_probability: number;
      };
      status: string;
    };
    language: {
      predictions: {
        language_predictions: string;
        language_probabilities: number[];
        language_probability: number;
      };
      status: string;
    };
    intent: {
      predictions: {
        intent_predictions: string;
        intent_probabilities: number[];
        intent_probability: number;
      };
      status: string;
    };
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
