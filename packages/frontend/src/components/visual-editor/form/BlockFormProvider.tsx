/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
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
