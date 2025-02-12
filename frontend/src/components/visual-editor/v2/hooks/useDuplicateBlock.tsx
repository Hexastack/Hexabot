/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { useMutation, useQueryClient } from "react-query";

import { useApiClient } from "@/hooks/useApiClient";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { TMutationOptions } from "@/services/types";
import { IBlock, IBlockStub } from "@/types/block.types";

interface IDuplicateBlockAttributes {
  blockId: string;
}
export const useDuplicateBlock = (
  options?: Omit<
    TMutationOptions<IBlockStub, Error, IDuplicateBlockAttributes, unknown>,
    "mutationFn"
  >,
) => {
  const { apiClient } = useApiClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslate();

  return useMutation<IBlock, Error, IDuplicateBlockAttributes>({
    ...options,
    async mutationFn({ blockId }: IDuplicateBlockAttributes) {
      return await apiClient.duplicateBlock(blockId);
    },
    onSuccess: (duplicatedBlock) => {
      queryClient.invalidateQueries([
        "collection",
        "Block",
        { where: { category: `${duplicatedBlock.category}` } },
      ]);
    },
    onError: () => {
      toast.error(t("message.duplicate_block_error"));
    },
  });
};
