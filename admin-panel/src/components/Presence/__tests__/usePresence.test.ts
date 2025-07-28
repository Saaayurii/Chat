import { renderHook, act } from '@testing-library/react';
import { usePresence } from '../usePresence';
import { PresenceStatus } from '../types';

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    connected: false,
    connect: jest.fn(),
    disconnect: jest.fn(),
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn()
  }))
}));

// Mock cross tab sync
jest.mock('../useCrossTabSync', () => ({
  useCrossTabSync: jest.fn(() => ({
    isActiveTab: true,
    sendPresenceUpdate: jest.fn(),
    requestPresenceSync: jest.fn(),
    tabId: 'test-tab-id'
  }))
}));

describe('usePresence', () => {
  const defaultOptions = {
    apiUrl: 'http://localhost:3000',
    userId: 'test-user',
    token: 'test-token'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with default values', () => {
    const { result } = renderHook(() => usePresence(defaultOptions));
    
    expect(result.current.socket).toBeNull();
    expect(result.current.isConnected).toBe(false);
    expect(result.current.currentPresence).toBeNull();
    expect(result.current.onlineUsers).toEqual([]);
    expect(result.current.isActiveTab).toBe(true);
  });

  it('does not auto connect when autoConnect is false', () => {
    const { result } = renderHook(() => 
      usePresence({ ...defaultOptions, autoConnect: false })
    );
    
    expect(result.current.socket).toBeNull();
  });

  it('provides setStatus function', () => {
    const { result } = renderHook(() => usePresence(defaultOptions));
    
    expect(typeof result.current.setStatus).toBe('function');
    
    act(() => {
      result.current.setStatus(PresenceStatus.AWAY, 'Test activity');
    });
    
    // Should update current presence
    expect(result.current.currentPresence).toEqual({
      status: PresenceStatus.AWAY,
      lastSeen: expect.any(Number),
      activity: 'Test activity'
    });
  });

  it('provides requestPresence function', () => {
    const { result } = renderHook(() => usePresence(defaultOptions));
    
    expect(typeof result.current.requestPresence).toBe('function');
  });

  it('provides connect and disconnect functions', () => {
    const { result } = renderHook(() => usePresence(defaultOptions));
    
    expect(typeof result.current.connect).toBe('function');
    expect(typeof result.current.disconnect).toBe('function');
  });

  it('handles cross-tab sync when enabled', () => {
    const { result } = renderHook(() => 
      usePresence({ ...defaultOptions, enableCrossTabSync: true })
    );
    
    expect(result.current.isActiveTab).toBe(true);
  });

  it('disables cross-tab sync when option is false', () => {
    const { result } = renderHook(() => 
      usePresence({ ...defaultOptions, enableCrossTabSync: false })
    );
    
    expect(result.current.isActiveTab).toBe(true); // Always true when disabled
  });

  it('cleans up on unmount', () => {
    const { unmount } = renderHook(() => usePresence(defaultOptions));
    
    // Should not throw when unmounting
    expect(() => unmount()).not.toThrow();
  });
});