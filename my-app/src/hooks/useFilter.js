import { useState, useCallback } from 'react';

export const useFilter = (initialFilters = {}) => {
  const [filters, setFilters] = useState(initialFilters);
  const [isApplied, setIsApplied] = useState(false);

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setIsApplied(false);
  }, []);

  const updateMultiple = useCallback((newFilters) => {
    setFilters(newFilters);
    setIsApplied(false);
  }, []);

  const applyFilters = useCallback(() => {
    setIsApplied(true);
    return filters;
  }, [filters]);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    setIsApplied(false);
  }, [initialFilters]);

  const getFilterParams = useCallback(() => {
    const params = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v && v !== 'all') {
        params[k] = v;
      }
    });
    return params;
  }, [filters]);

  return {
    filters,
    updateFilter,
    updateMultiple,
    applyFilters,
    resetFilters,
    getFilterParams,
    isApplied
  };
};