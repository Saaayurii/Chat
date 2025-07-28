import { renderHook, act } from '@testing-library/react';
import { usePagination } from '../usePagination';

describe('usePagination Hook', () => {
  it('initializes with default values', () => {
    const { result } = renderHook(() => usePagination());
    
    expect(result.current.page).toBe(1);
    expect(result.current.limit).toBe(10);
    expect(result.current.offset).toBe(0);
  });

  it('initializes with custom values', () => {
    const { result } = renderHook(() => usePagination({ 
      initialPage: 3, 
      initialLimit: 20 
    }));
    
    expect(result.current.page).toBe(3);
    expect(result.current.limit).toBe(20);
    expect(result.current.offset).toBe(40); // (3-1) * 20
  });

  it('calculates offset correctly', () => {
    const { result } = renderHook(() => usePagination({ 
      initialPage: 5, 
      initialLimit: 15 
    }));
    
    expect(result.current.offset).toBe(60); // (5-1) * 15
  });

  it('goes to specific page', () => {
    const { result } = renderHook(() => usePagination());
    
    act(() => {
      result.current.goToPage(5);
    });
    
    expect(result.current.page).toBe(5);
    expect(result.current.offset).toBe(40); // (5-1) * 10
  });

  it('goes to next page', () => {
    const { result } = renderHook(() => usePagination({ initialPage: 2 }));
    
    act(() => {
      result.current.nextPage();
    });
    
    expect(result.current.page).toBe(3);
    expect(result.current.offset).toBe(20); // (3-1) * 10
  });

  it('goes to previous page', () => {
    const { result } = renderHook(() => usePagination({ initialPage: 3 }));
    
    act(() => {
      result.current.prevPage();
    });
    
    expect(result.current.page).toBe(2);
    expect(result.current.offset).toBe(10); // (2-1) * 10
  });

  it('does not go below page 1 when going to previous page', () => {
    const { result } = renderHook(() => usePagination({ initialPage: 1 }));
    
    act(() => {
      result.current.prevPage();
    });
    
    expect(result.current.page).toBe(1);
    expect(result.current.offset).toBe(0);
  });

  it('sets page size and resets to first page', () => {
    const { result } = renderHook(() => usePagination({ initialPage: 3 }));
    
    act(() => {
      result.current.setPageSize(25);
    });
    
    expect(result.current.limit).toBe(25);
    expect(result.current.page).toBe(1);
    expect(result.current.offset).toBe(0);
  });

  it('resets to initial values', () => {
    const { result } = renderHook(() => usePagination({ 
      initialPage: 2, 
      initialLimit: 15 
    }));
    
    act(() => {
      result.current.goToPage(5);
      result.current.setPageSize(30);
    });
    
    expect(result.current.page).toBe(1); // Reset by setPageSize
    expect(result.current.limit).toBe(30);
    
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.page).toBe(2);
    expect(result.current.limit).toBe(15);
    expect(result.current.offset).toBe(15); // (2-1) * 15
  });

  it('calculates total pages correctly', () => {
    const { result } = renderHook(() => usePagination({ initialLimit: 10 }));
    
    expect(result.current.getTotalPages(100)).toBe(10);
    expect(result.current.getTotalPages(95)).toBe(10);
    expect(result.current.getTotalPages(91)).toBe(10);
    expect(result.current.getTotalPages(90)).toBe(9);
    expect(result.current.getTotalPages(0)).toBe(0);
  });

  it('calculates total pages with different page sizes', () => {
    const { result } = renderHook(() => usePagination({ initialLimit: 25 }));
    
    expect(result.current.getTotalPages(100)).toBe(4);
    expect(result.current.getTotalPages(76)).toBe(4);
    expect(result.current.getTotalPages(75)).toBe(3);
    expect(result.current.getTotalPages(50)).toBe(2);
    expect(result.current.getTotalPages(25)).toBe(1);
  });

  it('handles edge cases for total pages calculation', () => {
    const { result } = renderHook(() => usePagination({ initialLimit: 10 }));
    
    expect(result.current.getTotalPages(1)).toBe(1);
    expect(result.current.getTotalPages(0)).toBe(0);
    expect(result.current.getTotalPages(-1)).toBe(0);
  });

  it('handles multiple consecutive page changes', () => {
    const { result } = renderHook(() => usePagination());
    
    act(() => {
      result.current.nextPage();
      result.current.nextPage();
      result.current.nextPage();
    });
    
    expect(result.current.page).toBe(4);
    expect(result.current.offset).toBe(30);
    
    act(() => {
      result.current.prevPage();
      result.current.prevPage();
    });
    
    expect(result.current.page).toBe(2);
    expect(result.current.offset).toBe(10);
  });

  it('updates offset when limit changes', () => {
    const { result } = renderHook(() => usePagination({ initialPage: 3 }));
    
    // Initial state: page 3, limit 10, offset 20
    expect(result.current.offset).toBe(20);
    
    act(() => {
      result.current.setPageSize(5);
    });
    
    // After changing page size, page resets to 1
    expect(result.current.page).toBe(1);
    expect(result.current.limit).toBe(5);
    expect(result.current.offset).toBe(0);
    
    act(() => {
      result.current.goToPage(3);
    });
    
    // Now with new limit: page 3, limit 5, offset 10
    expect(result.current.offset).toBe(10);
  });

  it('handles large page numbers correctly', () => {
    const { result } = renderHook(() => usePagination({ initialLimit: 50 }));
    
    act(() => {
      result.current.goToPage(100);
    });
    
    expect(result.current.page).toBe(100);
    expect(result.current.offset).toBe(4950); // (100-1) * 50
  });

  it('handles various page size changes', () => {
    const { result } = renderHook(() => usePagination({ initialPage: 5 }));
    
    act(() => {
      result.current.setPageSize(1);
    });
    
    expect(result.current.page).toBe(1);
    expect(result.current.limit).toBe(1);
    
    act(() => {
      result.current.goToPage(10);
    });
    
    expect(result.current.offset).toBe(9); // (10-1) * 1
    
    act(() => {
      result.current.setPageSize(100);
    });
    
    expect(result.current.page).toBe(1);
    expect(result.current.limit).toBe(100);
    expect(result.current.offset).toBe(0);
  });

  it('maintains immutability of state', () => {
    const { result } = renderHook(() => usePagination());
    
    const initialState = {
      page: result.current.page,
      limit: result.current.limit,
      offset: result.current.offset
    };
    
    act(() => {
      result.current.nextPage();
    });
    
    // Original state should not be modified
    expect(initialState.page).toBe(1);
    expect(initialState.limit).toBe(10);
    expect(initialState.offset).toBe(0);
    
    // New state should be different
    expect(result.current.page).toBe(2);
    expect(result.current.limit).toBe(10);
    expect(result.current.offset).toBe(10);
  });

  it('handles rapid state changes correctly', () => {
    const { result } = renderHook(() => usePagination());
    
    act(() => {
      result.current.nextPage();
      result.current.setPageSize(20);
      result.current.goToPage(5);
      result.current.prevPage();
      result.current.nextPage();
    });
    
    expect(result.current.page).toBe(5);
    expect(result.current.limit).toBe(20);
    expect(result.current.offset).toBe(80); // (5-1) * 20
  });
});