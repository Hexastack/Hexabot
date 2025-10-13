/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useCallback, useMemo } from "react";

import { useFind } from "@/hooks/crud/useFind";
import { EntityType } from "@/services/types";

import { useVisualEditor } from "./useVisualEditor";

export const useCategories = () => {
  const { selectedCategoryId, setSelectedCategoryId } = useVisualEditor();
  const { data: categories } = useFind(
    { entity: EntityType.CATEGORY },
    {
      hasCount: false,
      initialSortState: [{ field: "createdAt", sort: "asc" }],
    },
    {
      onSuccess([category]) {
        if (!selectedCategoryId && category) {
          setSelectedCategoryId(category.id);
        }
      },
    },
  );
  const setDefaultCategory = useCallback(() => {
    if (categories.length) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, setSelectedCategoryId]);
  const getCategoryIndex = useCallback(
    (categoryId?: string) =>
      categoryId ? categories.findIndex(({ id }) => id === categoryId) : 0,
    [categories],
  );
  const selectedCategory = useMemo(
    () => categories.find(({ id }) => id === selectedCategoryId),
    [categories, selectedCategoryId],
  );
  const selectedCategoryIndex = useMemo(() => {
    if (!categories?.length) return false;

    return getCategoryIndex(selectedCategoryId);
  }, [categories?.length, getCategoryIndex, selectedCategoryId]);
  const getCategory = useCallback(
    (index: number) => {
      if (categories.length) {
        return categories[index];
      }
    },
    [categories],
  );

  return {
    categories,
    getCategory,
    getCategoryIndex,
    selectedCategory,
    setDefaultCategory,
    selectedCategoryIndex,
  };
};
