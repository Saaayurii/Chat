import { renderHook, act } from '@testing-library/react';
import { useNotifications } from '../useNotifications';

// Mock setTimeout and clearTimeout
jest.useFakeTimers();

// Mock Date.now to provide predictable IDs
let mockIdCounter = 0;
jest.spyOn(global.Date, 'now').mockImplementation(() => {
  return ++mockIdCounter;
});

describe('useNotifications Hook', () => {
  beforeEach(() => {
    jest.clearAllTimers();
    mockIdCounter = 0;
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.clearAllTimers();
  });

  it('initializes with empty notifications array', () => {
    const { result } = renderHook(() => useNotifications());
    
    expect(result.current.notifications).toEqual([]);
  });

  it('adds notification with auto-generated id', () => {
    const { result } = renderHook(() => useNotifications());
    
    let notificationId: string;
    
    act(() => {
      notificationId = result.current.addNotification({
        type: 'success',
        message: 'Test notification'
      });
    });
    
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0]).toEqual({
      id: notificationId!,
      type: 'success',
      message: 'Test notification'
    });
  });

  it('removes notification by id', () => {
    const { result } = renderHook(() => useNotifications());
    
    let notificationId: string;
    
    act(() => {
      notificationId = result.current.addNotification({
        type: 'info',
        message: 'Test notification'
      });
    });
    
    expect(result.current.notifications).toHaveLength(1);
    
    act(() => {
      result.current.removeNotification(notificationId);
    });
    
    expect(result.current.notifications).toHaveLength(0);
  });

  it('clears all notifications', () => {
    const { result } = renderHook(() => useNotifications());
    
    act(() => {
      result.current.addNotification({ type: 'success', message: 'First' });
      result.current.addNotification({ type: 'error', message: 'Second' });
      result.current.addNotification({ type: 'warning', message: 'Third' });
    });
    
    expect(result.current.notifications).toHaveLength(3);
    
    act(() => {
      result.current.clearAll();
    });
    
    expect(result.current.notifications).toHaveLength(0);
  });

  it('adds success notification', () => {
    const { result } = renderHook(() => useNotifications());
    
    act(() => {
      result.current.success('Success message');
    });
    
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0]).toMatchObject({
      type: 'success',
      message: 'Success message'
    });
  });

  it('adds error notification', () => {
    const { result } = renderHook(() => useNotifications());
    
    act(() => {
      result.current.error('Error message');
    });
    
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0]).toMatchObject({
      type: 'error',
      message: 'Error message'
    });
  });

  it('adds warning notification', () => {
    const { result } = renderHook(() => useNotifications());
    
    act(() => {
      result.current.warning('Warning message');
    });
    
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0]).toMatchObject({
      type: 'warning',
      message: 'Warning message'
    });
  });

  it('adds info notification', () => {
    const { result } = renderHook(() => useNotifications());
    
    act(() => {
      result.current.info('Info message');
    });
    
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0]).toMatchObject({
      type: 'info',
      message: 'Info message'
    });
  });

  it('auto-removes notification after default duration', () => {
    const { result } = renderHook(() => useNotifications());
    
    act(() => {
      result.current.addNotification({
        type: 'success',
        message: 'Auto-remove test'
      });
    });
    
    expect(result.current.notifications).toHaveLength(1);
    
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    
    expect(result.current.notifications).toHaveLength(0);
  });

  it('auto-removes notification after custom duration', () => {
    const { result } = renderHook(() => useNotifications());
    
    act(() => {
      result.current.addNotification({
        type: 'success',
        message: 'Custom duration test',
        duration: 3000
      });
    });
    
    expect(result.current.notifications).toHaveLength(1);
    
    act(() => {
      jest.advanceTimersByTime(2999);
    });
    
    expect(result.current.notifications).toHaveLength(1);
    
    act(() => {
      jest.advanceTimersByTime(1);
    });
    
    expect(result.current.notifications).toHaveLength(0);
  });

  it('does not auto-remove notification with duration 0', () => {
    const { result } = renderHook(() => useNotifications());
    
    act(() => {
      result.current.addNotification({
        type: 'success',
        message: 'Persistent notification',
        duration: 0
      });
    });
    
    expect(result.current.notifications).toHaveLength(1);
    
    act(() => {
      jest.advanceTimersByTime(10000);
    });
    
    expect(result.current.notifications).toHaveLength(1);
  });

  it('handles multiple notifications correctly', () => {
    const { result } = renderHook(() => useNotifications());
    
    act(() => {
      result.current.success('First notification');
      result.current.error('Second notification');
      result.current.warning('Third notification');
    });
    
    expect(result.current.notifications).toHaveLength(3);
    expect(result.current.notifications[0].message).toBe('First notification');
    expect(result.current.notifications[1].message).toBe('Second notification');
    expect(result.current.notifications[2].message).toBe('Third notification');
  });

  it('removes correct notification when multiple exist', () => {
    const { result } = renderHook(() => useNotifications());
    
    let firstId: string = '';
    let secondId: string = '';
    let thirdId: string = '';
    
    act(() => {
      firstId = result.current.success('First notification', 0);
      secondId = result.current.error('Second notification', 0);
      thirdId = result.current.warning('Third notification', 0);
    });
    
    expect(result.current.notifications).toHaveLength(3);
    
    act(() => {
      result.current.removeNotification(secondId);
    });
    
    expect(result.current.notifications).toHaveLength(2);
    expect(result.current.notifications[0].id).toBe(firstId);
    expect(result.current.notifications[1].id).toBe(thirdId);
  });

  it('handles rapid addition and removal', () => {
    const { result } = renderHook(() => useNotifications());
    
    act(() => {
      const id1 = result.current.success('First', 0);
      const id2 = result.current.error('Second', 0);
      const id3 = result.current.warning('Third', 0);
      
      result.current.removeNotification(id2);
      result.current.removeNotification(id1);
      
      result.current.info('Fourth', 0);
    });
    
    expect(result.current.notifications).toHaveLength(2);
    expect(result.current.notifications[0].message).toBe('Third');
    expect(result.current.notifications[1].message).toBe('Fourth');
  });

  it('returns notification id when adding', () => {
    const { result } = renderHook(() => useNotifications());
    
    let notificationId: string;
    
    act(() => {
      notificationId = result.current.addNotification({
        type: 'success',
        message: 'Test'
      });
    });
    
    expect(typeof notificationId!).toBe('string');
    expect(notificationId!.length).toBeGreaterThan(0);
    expect(result.current.notifications[0].id).toBe(notificationId!);
  });

  it('returns notification id from helper methods', () => {
    const { result } = renderHook(() => useNotifications());
    
    let successId: string;
    let errorId: string;
    let warningId: string;
    let infoId: string;
    
    act(() => {
      successId = result.current.success('Success');
      errorId = result.current.error('Error');
      warningId = result.current.warning('Warning');
      infoId = result.current.info('Info');
    });
    
    expect(typeof successId!).toBe('string');
    expect(typeof errorId!).toBe('string');
    expect(typeof warningId!).toBe('string');
    expect(typeof infoId!).toBe('string');
    
    expect(result.current.notifications[0].id).toBe(successId!);
    expect(result.current.notifications[1].id).toBe(errorId!);
    expect(result.current.notifications[2].id).toBe(warningId!);
    expect(result.current.notifications[3].id).toBe(infoId!);
  });

  it('handles custom duration in helper methods', () => {
    const { result } = renderHook(() => useNotifications());
    
    act(() => {
      result.current.success('Success message', 1000);
    });
    
    expect(result.current.notifications).toHaveLength(1);
    
    act(() => {
      jest.advanceTimersByTime(999);
    });
    
    expect(result.current.notifications).toHaveLength(1);
    
    act(() => {
      jest.advanceTimersByTime(1);
    });
    
    expect(result.current.notifications).toHaveLength(0);
  });

  it('handles removing non-existent notification gracefully', () => {
    const { result } = renderHook(() => useNotifications());
    
    act(() => {
      result.current.addNotification({
        type: 'success',
        message: 'Test'
      });
    });
    
    expect(result.current.notifications).toHaveLength(1);
    
    act(() => {
      result.current.removeNotification('non-existent-id');
    });
    
    expect(result.current.notifications).toHaveLength(1);
  });

  it('generates unique ids for notifications', () => {
    const { result } = renderHook(() => useNotifications());
    
    let id1: string = '';
    let id2: string = '';
    let id3: string = '';
    
    act(() => {
      id1 = result.current.success('First', 0);
      id2 = result.current.success('Second', 0);
      id3 = result.current.success('Third', 0);
    });
    
    expect(id1).not.toBe(id2);
    expect(id2).not.toBe(id3);
    expect(id1).not.toBe(id3);
  });
});