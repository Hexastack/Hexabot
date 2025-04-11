/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { createContext, ReactNode, useContext } from "react";
import { FormProvider, UseFormReturn } from "react-hook-form";

import { IBlock, IBlockAttributes } from "@/types/block.types";

// Create a custom context for the block value
const BlockContext = createContext<IBlock | undefined>(undefined);

// Custom hook to use block context
export const useBlock = () => {
  const context = useContext(BlockContext);

  if (!context) {
    throw new Error("useBlock must be used within an BlockContext");
  }

  return context;
};

// This component wraps FormProvider and adds block to its context
function BlockFormProvider({
  children,
  methods,
  block,
}: {
  methods: UseFormReturn<IBlockAttributes>;
  block: IBlock | undefined;
  children: ReactNode;
}) {
  return (
    <FormProvider {...methods}>
      <BlockContext.Provider value={block}>{children}</BlockContext.Provider>
    </FormProvider>
  );
}

export default BlockFormProvider;
