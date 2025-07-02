'use client';

import { useState, useCallback } from 'react';

interface UsePaginationProps {
  initialPage?: number;
  initialLimit?: number;
}

interface PaginationState {
  page: number;
  limit: number;
  offset: number;
}

export function usePagination({ 
  initialPage = 1, 
  initialLimit = 10 
}: UsePaginationProps = {}) {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const offset = (page - 1) * limit;

  const goToPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const nextPage = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  const prevPage = useCallback(() => {
    setPage(prev => Math.max(1, prev - 1));
  }, []);

  const setPageSize = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when changing page size
  }, []);

  const reset = useCallback(() => {
    setPage(initialPage);
    setLimit(initialLimit);
  }, [initialPage, initialLimit]);

  const getTotalPages = useCallback((total: number) => {
    return Math.ceil(total / limit);
  }, [limit]);

  return {
    page,
    limit,
    offset,
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
    reset,
    getTotalPages
  };
}