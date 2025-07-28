import { renderHook, act } from '@testing-library/react';
import { useApiCall } from '../useApiCall';

describe('useApiCall Hook', () => {
  it('initializes with default state', () => {
    const { result } = renderHook(() => useApiCall());
    
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets loading state during API call', async () => {
    const { result } = renderHook(() => useApiCall());
    
    const mockApiCall = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    act(() => {
      result.current.execute(mockApiCall);
    });
    
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('handles successful API call', async () => {
    const { result } = renderHook(() => useApiCall());
    
    const mockData = { id: 1, name: 'Test' };
    const mockApiCall = jest.fn(() => Promise.resolve(mockData));
    
    await act(async () => {
      const response = await result.current.execute(mockApiCall);
      expect(response).toEqual(mockData);
    });
    
    expect(result.current.data).toEqual(mockData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles API call with error', async () => {
    const { result } = renderHook(() => useApiCall());
    
    const mockError = new Error('API Error');
    const mockApiCall = jest.fn(() => Promise.reject(mockError));
    
    await act(async () => {
      try {
        await result.current.execute(mockApiCall);
      } catch (error) {
        expect(error).toBe(mockError);
      }
    });
    
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('API Error');
  });

  it('handles API call with response error', async () => {
    const { result } = renderHook(() => useApiCall());
    
    const mockError = {
      response: {
        data: {
          message: 'Server Error'
        }
      }
    };
    const mockApiCall = jest.fn(() => Promise.reject(mockError));
    
    await act(async () => {
      try {
        await result.current.execute(mockApiCall);
      } catch (error) {
        expect(error).toBe(mockError);
      }
    });
    
    expect(result.current.error).toBe('Server Error');
  });

  it('handles API call with unknown error', async () => {
    const { result } = renderHook(() => useApiCall());
    
    const mockError = {};
    const mockApiCall = jest.fn(() => Promise.reject(mockError));
    
    await act(async () => {
      try {
        await result.current.execute(mockApiCall);
      } catch (error) {
        expect(error).toBe(mockError);
      }
    });
    
    expect(result.current.error).toBe('Произошла ошибка');
  });

  it('resets state', () => {
    const { result } = renderHook(() => useApiCall());
    
    act(() => {
      result.current.setData({ id: 1, name: 'Test' });
      result.current.setError('Test Error');
      result.current.setLoading(true);
    });
    
    expect(result.current.data).toEqual({ id: 1, name: 'Test' });
    expect(result.current.error).toBe('Test Error');
    expect(result.current.loading).toBe(true);
    
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('sets data manually', () => {
    const { result } = renderHook(() => useApiCall());
    
    const testData = { id: 1, name: 'Test' };
    
    act(() => {
      result.current.setData(testData);
    });
    
    expect(result.current.data).toEqual(testData);
  });

  it('sets error manually', () => {
    const { result } = renderHook(() => useApiCall());
    
    act(() => {
      result.current.setLoading(true);
      result.current.setError('Manual Error');
    });
    
    expect(result.current.error).toBe('Manual Error');
    expect(result.current.loading).toBe(false);
  });

  it('sets loading state manually', () => {
    const { result } = renderHook(() => useApiCall());
    
    act(() => {
      result.current.setLoading(true);
    });
    
    expect(result.current.loading).toBe(true);
    
    act(() => {
      result.current.setLoading(false);
    });
    
    expect(result.current.loading).toBe(false);
  });

  it('handles multiple consecutive API calls', async () => {
    const { result } = renderHook(() => useApiCall());
    
    const mockApiCall1 = jest.fn(() => Promise.resolve({ id: 1 }));
    const mockApiCall2 = jest.fn(() => Promise.resolve({ id: 2 }));
    
    await act(async () => {
      await result.current.execute(mockApiCall1);
    });
    
    expect(result.current.data).toEqual({ id: 1 });
    
    await act(async () => {
      await result.current.execute(mockApiCall2);
    });
    
    expect(result.current.data).toEqual({ id: 2 });
  });

  it('handles API call that throws string error', async () => {
    const { result } = renderHook(() => useApiCall());
    
    const mockApiCall = jest.fn(() => Promise.reject('String error'));
    
    await act(async () => {
      try {
        await result.current.execute(mockApiCall);
      } catch (error) {
        expect(error).toBe('String error');
      }
    });
    
    expect(result.current.error).toBe('Произошла ошибка');
  });

  it('preserves other state properties when setting individual values', () => {
    const { result } = renderHook(() => useApiCall());
    
    act(() => {
      result.current.setData({ id: 1 });
      result.current.setError('Test Error');
    });
    
    expect(result.current.data).toEqual({ id: 1 });
    expect(result.current.error).toBe('Test Error');
    expect(result.current.loading).toBe(false);
    
    act(() => {
      result.current.setLoading(true);
    });
    
    expect(result.current.data).toEqual({ id: 1 });
    expect(result.current.error).toBe('Test Error');
    expect(result.current.loading).toBe(true);
  });

  it('resets state before executing new API call', async () => {
    const { result } = renderHook(() => useApiCall());
    
    // Set initial state
    act(() => {
      result.current.setData({ id: 1 });
      result.current.setError('Previous Error');
    });
    
    const mockApiCall = jest.fn(() => Promise.resolve({ id: 2 }));
    
    await act(async () => {
      await result.current.execute(mockApiCall);
    });
    
    expect(result.current.data).toEqual({ id: 2 });
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});