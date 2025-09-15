import { useEffect, useRef } from 'react';

interface AuthState {
  token?: string | null;
  isAuthenticated: boolean;
  sessionId?: string;
  isAnonymous?: boolean;
}

interface AuthConfig {
  initializeAuth: () => void;
  onAuthChange?: (authState: AuthState) => void;
}

export var useSocketAuth = (authState: AuthState, config: AuthConfig) => {
  var { initializeAuth, onAuthChange } = config;
  var isAuthenticatedRef = useRef(authState.isAuthenticated);
  var tokenRef = useRef(authState.token);
  var authStateRef = useRef(authState);

  useEffect(() => {
    console.log(`[${new Date().toISOString()}] SocketAuth: Initializing auth`);
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    var timestamp = new Date().toISOString();
    console.log(`[${timestamp}] SocketAuth: Auth state changed - authenticated: ${authState.isAuthenticated}, token: ${!!authState.token}`);
    
    isAuthenticatedRef.current = authState.isAuthenticated;
    tokenRef.current = authState.token;
    authStateRef.current = authState;
    
    onAuthChange?.(authState);
  }, [authState.isAuthenticated, authState.token, authState.sessionId, authState.isAnonymous, onAuthChange]);

  var shouldConnect = () => 
    new Promise<boolean>((resolve) => {
      var authenticated = authState.isAnonymous ? 
        !!authState.sessionId : 
        authState.isAuthenticated && !!authState.token;
      
      resolve(authenticated);
    });

  var getConnectionConfig = () => 
    new Promise<{ token?: string; sessionId?: string; isAnonymous: boolean }>((resolve) => {
      resolve({
        token: authState.token || undefined,
        sessionId: authState.sessionId,
        isAnonymous: authState.isAnonymous || false
      });
    });

  return {
    isAuthenticatedRef,
    tokenRef,
    authStateRef,
    shouldConnect,
    getConnectionConfig
  };
};