import { useState, useMemo, useCallback } from 'react';

export const useTable = (data = [], initialPageSize = 100) => {
  const [sortKey, setSortKey] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const handleSort = useCallback((key) => {
    setSortKey(prev => {
      if (prev === key) {
        setSortAsc(asc => !asc);
        return key;
      }
      setSortAsc(true);
      return key;
    });
    setPage(1);
  }, []);

  const sorted = useMemo(() => {
    if (!sortKey || !data.length) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (typeof aVal === 'string') {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortAsc]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  const totalPages = Math.ceil(sorted.length / pageSize);

  return {
    sortKey,
    sortAsc,
    handleSort,
    page,
    setPage,
    pageSize,
    setPageSize,
    sorted,
    paginated,
    totalPages,
    totalRows: data.length
  };
};