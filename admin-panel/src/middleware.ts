import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  try {
    const pathname = request.nextUrl?.pathname;
    
    // Проверка на наличие pathname
    if (!pathname) {
      return NextResponse.next();
    }
    
    // Проверяем, если это админская или операторская страница
    if (pathname.startsWith('/admin') || pathname.startsWith('/operator')) {
      // Получаем токен из cookies
      const cookieToken = request.cookies?.get('access_token')?.value;
      
      // Если нет токена в cookies, перенаправляем на страницу входа
      if (!cookieToken) {
        // Проверяем, это не запрос на статические ресурсы
        if (pathname.includes('/_next/') || pathname.includes('/api/')) {
          return NextResponse.next();
        }
        
        // Логируем для отладки
        console.log('No token found for protected route:', pathname);
        
        // Если нет токена и это не специальные пути, перенаправляем на страницу входа
        try {
          return NextResponse.redirect(new URL('/login', request.url));
        } catch (error) {
          // Fallback если URL невалидный
          return NextResponse.next();
        }
      }
      
      console.log('Token found for protected route:', pathname);
    }

    // Если это корневая страница, перенаправляем на страницу входа
    if (pathname === '/') {
      try {
        return NextResponse.redirect(new URL('/login', request.url));
      } catch (error) {
        // Fallback если URL невалидный
        return NextResponse.next();
      }
    }
    
    return NextResponse.next();
  } catch (error) {
    // Общий fallback для любых ошибок
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};