package com.lila_shop.backend.util;

import com.lila_shop.backend.entity.Category;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class CategoryUtil {

    /**
     * Recursively collects all child category IDs for a given set of category IDs.
     * 
     * @param categories The initial set of categories.
     * @return A set of IDs including the initial categories and all their
     *         descendants.
     */
    public static Set<String> getAllCategoryIds(Set<Category> categories) {
        Set<String> allIds = new HashSet<>();
        if (categories == null || categories.isEmpty()) {
            return allIds;
        }

        for (Category category : categories) {
            collectIdsRecursive(category, allIds);
        }
        return allIds;
    }

    private static void collectIdsRecursive(Category category, Set<String> allIds) {
        if (category == null || category.getId() == null) {
            return;
        }
        allIds.add(category.getId());
        List<Category> subCategories = category.getSubCategories();
        if (subCategories != null && !subCategories.isEmpty()) {
            for (Category sub : subCategories) {
                collectIdsRecursive(sub, allIds);
            }
        }
    }

    /**
     * Recursively collects all parent category IDs for a given category.
     * 
     * @param category The category to start from.
     * @return A set of IDs including the category itself and all its ancestors.
     */
    public static Set<String> getAncestorCategoryIds(Category category) {
        Set<String> allIds = new HashSet<>();
        if (category == null) {
            return allIds;
        }

        Category current = category;
        while (current != null) {
            if (current.getId() != null) {
                allIds.add(current.getId());
            }
            current = current.getParentCategory();
        }
        return allIds;
    }

    /**
     * Checks if a category is a descendant of or equal to any category in the
     * target set.
     */
    public static boolean isCategoryInScope(Category category, Set<Category> targetCategories) {
        if (category == null || targetCategories == null || targetCategories.isEmpty()) {
            return false;
        }

        Set<String> scopeIds = getAllCategoryIds(targetCategories);
        return scopeIds.contains(category.getId());
    }
}
