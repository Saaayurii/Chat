import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '../middleware';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    redirect: jest.fn(),
    next: jest.fn(),
  },
}));

const mockRedirect = NextResponse.redirect as jest.MockedFunction<typeof NextResponse.redirect>;
const mockNext = NextResponse.next as jest.MockedFunction<typeof NextResponse.next>;

describe('Middleware', () => {
  let mockRequest: Partial<NextRequest>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRequest = {
      nextUrl: {
        pathname: '/',
      } as any,
      url: 'http://localhost:3000',
      cookies: {
        get: jest.fn(),
      } as any,
    };

    // Setup default mock returns
    mockRedirect.mockReturnValue('redirected' as any);
    mockNext.mockReturnValue('next' as any);
  });

  describe('Root Path Redirect', () => {
    test('redirects root path to /login', () => {
      mockRequest.nextUrl!.pathname = '/';
      
      const result = middleware(mockRequest as NextRequest);
      
      expect(mockRedirect).toHaveBeenCalledWith(new URL('/login', mockRequest.url));
      expect(result).toBe('redirected');
    });

    test('does not redirect non-root paths', () => {
      mockRequest.nextUrl!.pathname = '/login';
      
      const result = middleware(mockRequest as NextRequest);
      
      expect(mockRedirect).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
      expect(result).toBe('next');
    });
  });

  describe('Admin Route Protection', () => {
    test('redirects to login when accessing admin route without token', () => {
      mockRequest.nextUrl!.pathname = '/admin/statistics';
      mockRequest.cookies!.get = jest.fn().mockReturnValue(undefined);
      
      const result = middleware(mockRequest as NextRequest);
      
      expect(mockRequest.cookies!.get).toHaveBeenCalledWith('access_token');
      expect(mockRedirect).toHaveBeenCalledWith(new URL('/login', mockRequest.url));
      expect(result).toBe('redirected');
    });

    test('allows access to admin route with valid token', () => {
      mockRequest.nextUrl!.pathname = '/admin/statistics';
      mockRequest.cookies!.get = jest.fn().mockReturnValue({ value: 'valid-token' });
      
      const result = middleware(mockRequest as NextRequest);
      
      expect(mockRequest.cookies!.get).toHaveBeenCalledWith('access_token');
      expect(mockRedirect).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
      expect(result).toBe('next');
    });

    test('protects nested admin routes', () => {
      mockRequest.nextUrl!.pathname = '/admin/users/manage';
      mockRequest.cookies!.get = jest.fn().mockReturnValue(undefined);
      
      const result = middleware(mockRequest as NextRequest);
      
      expect(mockRedirect).toHaveBeenCalledWith(new URL('/login', mockRequest.url));
      expect(result).toBe('redirected');
    });
  });

  describe('Operator Route Protection', () => {
    test('redirects to login when accessing operator route without token', () => {
      mockRequest.nextUrl!.pathname = '/operator/chat';
      mockRequest.cookies!.get = jest.fn().mockReturnValue(undefined);
      
      const result = middleware(mockRequest as NextRequest);
      
      expect(mockRequest.cookies!.get).toHaveBeenCalledWith('access_token');
      expect(mockRedirect).toHaveBeenCalledWith(new URL('/login', mockRequest.url));
      expect(result).toBe('redirected');
    });

    test('allows access to operator route with valid token', () => {
      mockRequest.nextUrl!.pathname = '/operator/chat';
      mockRequest.cookies!.get = jest.fn().mockReturnValue({ value: 'valid-token' });
      
      const result = middleware(mockRequest as NextRequest);
      
      expect(mockRequest.cookies!.get).toHaveBeenCalledWith('access_token');
      expect(mockRedirect).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
      expect(result).toBe('next');
    });

    test('protects nested operator routes', () => {
      mockRequest.nextUrl!.pathname = '/operator/dashboard';
      mockRequest.cookies!.get = jest.fn().mockReturnValue(undefined);
      
      const result = middleware(mockRequest as NextRequest);
      
      expect(mockRedirect).toHaveBeenCalledWith(new URL('/login', mockRequest.url));
      expect(result).toBe('redirected');
    });
  });

  describe('Public Route Access', () => {
    const publicRoutes = [
      '/login',
      '/registration',
      '/reset',
      '/reset-password',
      '/chat'
    ];

    publicRoutes.forEach(route => {
      test(`allows access to public route: ${route}`, () => {
        mockRequest.nextUrl!.pathname = route;
        mockRequest.cookies!.get = jest.fn().mockReturnValue(undefined);
        
        const result = middleware(mockRequest as NextRequest);
        
        expect(mockRedirect).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalled();
        expect(result).toBe('next');
      });
    });
  });

  describe('Static Assets and API Routes', () => {
    const excludedPaths = [
      '/api/auth/login',
      '/_next/static/js/main.js',
      '/_next/image/logo.png',
      '/favicon.ico',
      '/public/logo.png'
    ];

    excludedPaths.forEach(path => {
      test(`does not process excluded path: ${path}`, () => {
        mockRequest.nextUrl!.pathname = path;
        
        // These paths should be excluded by the matcher config
        // so middleware shouldn't even be called, but we test
        // that it would handle them gracefully if called
        const result = middleware(mockRequest as NextRequest);
        
        expect(mockNext).toHaveBeenCalled();
        expect(result).toBe('next');
      });
    });
  });

  describe('Token Validation', () => {
    test('handles empty token value', () => {
      mockRequest.nextUrl!.pathname = '/admin/statistics';
      mockRequest.cookies!.get = jest.fn().mockReturnValue({ value: '' });
      
      const result = middleware(mockRequest as NextRequest);
      
      expect(mockRedirect).toHaveBeenCalledWith(new URL('/login', mockRequest.url));
      expect(result).toBe('redirected');
    });

    test('handles null token', () => {
      mockRequest.nextUrl!.pathname = '/admin/statistics';
      mockRequest.cookies!.get = jest.fn().mockReturnValue(null);
      
      const result = middleware(mockRequest as NextRequest);
      
      expect(mockRedirect).toHaveBeenCalledWith(new URL('/login', mockRequest.url));
      expect(result).toBe('redirected');
    });

    test('accepts any non-empty token value', () => {
      mockRequest.nextUrl!.pathname = '/admin/statistics';
      mockRequest.cookies!.get = jest.fn().mockReturnValue({ value: 'any-token-value' });
      
      const result = middleware(mockRequest as NextRequest);
      
      expect(mockRedirect).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
      expect(result).toBe('next');
    });
  });

  describe('URL Construction', () => {
    test('constructs redirect URL correctly for different base URLs', () => {
      mockRequest.nextUrl!.pathname = '/';
      (mockRequest as any).url = 'https://example.com/some/path';
      
      const result = middleware(mockRequest as NextRequest);
      
      expect(mockRedirect).toHaveBeenCalledWith(new URL('/login', 'https://example.com/some/path'));
      expect(result).toBe('redirected');
    });

    test('constructs login redirect URL correctly', () => {
      mockRequest.nextUrl!.pathname = '/admin/statistics';
      (mockRequest as any).url = 'https://example.com/admin/statistics';
      mockRequest.cookies!.get = jest.fn().mockReturnValue(undefined);
      
      const result = middleware(mockRequest as NextRequest);
      
      expect(mockRedirect).toHaveBeenCalledWith(new URL('/login', 'https://example.com/admin/statistics'));
      expect(result).toBe('redirected');
    });
  });

  describe('Edge Cases', () => {
    test('handles undefined pathname', () => {
      mockRequest.nextUrl!.pathname = undefined as any;
      
      const result = middleware(mockRequest as NextRequest);
      
      expect(mockNext).toHaveBeenCalled();
      expect(result).toBe('next');
    });

    test('handles malformed URLs gracefully', () => {
      mockRequest.nextUrl!.pathname = '/admin/statistics';
      (mockRequest as any).url = 'invalid-url';
      mockRequest.cookies!.get = jest.fn().mockReturnValue(undefined);
      
      // Should not throw error
      expect(() => {
        middleware(mockRequest as NextRequest);
      }).not.toThrow();
    });

    test('handles missing cookies object', () => {
      mockRequest.nextUrl!.pathname = '/admin/statistics';
      (mockRequest as any).cookies = undefined;
      
      // Should not throw error and should redirect to login
      expect(() => {
        const result = middleware(mockRequest as NextRequest);
        expect(mockRedirect).toHaveBeenCalledWith(new URL('/login', mockRequest.url));
      }).not.toThrow();
    });
  });

  describe('Route Pattern Matching', () => {
    test('matches admin routes with various paths', () => {
      const adminPaths = [
        '/admin',
        '/admin/',
        '/admin/statistics',
        '/admin/users',
        '/admin/settings/general'
      ];

      adminPaths.forEach(path => {
        mockRequest.nextUrl!.pathname = path;
        mockRequest.cookies!.get = jest.fn().mockReturnValue(undefined);
        
        const result = middleware(mockRequest as NextRequest);
        
        expect(mockRedirect).toHaveBeenCalledWith(new URL('/login', mockRequest.url));
        expect(result).toBe('redirected');
        
        jest.clearAllMocks();
        mockRedirect.mockReturnValue('redirected' as any);
      });
    });

    test('matches operator routes with various paths', () => {
      const operatorPaths = [
        '/operator',
        '/operator/',
        '/operator/chat',
        '/operator/dashboard'
      ];

      operatorPaths.forEach(path => {
        mockRequest.nextUrl!.pathname = path;
        mockRequest.cookies!.get = jest.fn().mockReturnValue(undefined);
        
        const result = middleware(mockRequest as NextRequest);
        
        expect(mockRedirect).toHaveBeenCalledWith(new URL('/login', mockRequest.url));
        expect(result).toBe('redirected');
        
        jest.clearAllMocks();
        mockRedirect.mockReturnValue('redirected' as any);
      });
    });
  });

  describe('Security Considerations', () => {
    test('does not expose sensitive information in redirects', () => {
      mockRequest.nextUrl!.pathname = '/admin/statistics';
      mockRequest.cookies!.get = jest.fn().mockReturnValue(undefined);
      
      middleware(mockRequest as NextRequest);
      
      // Should only redirect to login, not expose the original destination
      expect(mockRedirect).toHaveBeenCalledWith(new URL('/login', mockRequest.url));
    });

    test('consistently handles authentication for all protected routes', () => {
      const protectedRoutes = [
        '/admin/statistics',
        '/admin/users',
        '/operator/chat',
        '/operator/dashboard'
      ];

      protectedRoutes.forEach(route => {
        mockRequest.nextUrl!.pathname = route;
        mockRequest.cookies!.get = jest.fn().mockReturnValue(undefined);
        
        const result = middleware(mockRequest as NextRequest);
        
        expect(mockRedirect).toHaveBeenCalledWith(new URL('/login', mockRequest.url));
        expect(result).toBe('redirected');
        
        jest.clearAllMocks();
        mockRedirect.mockReturnValue('redirected' as any);
      });
    });
  });
});