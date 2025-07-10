import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  try {
    const pathname = request.nextUrl?.pathname;
    
    // Проверка на наличие pathname
    if (!pathname) {
      return NextResponse.next();
    }
    
    // Проверяем, если это админская страница
    if (pathname.startsWith('/admin') || pathname.startsWith('/operator')) {
      // Получаем токен из cookies (с проверкой на наличие cookies)
      const token = request.cookies?.get('access_token')?.value;
      
      if (!token) {
        // Если нет токена, перенаправляем на страницу входа
        try {
          return NextResponse.redirect(new URL('/login', request.url));
        } catch (error) {
          // Fallback если URL невалидный
          return NextResponse.next();
        }
      }
      
      // Здесь можно добавить проверку роли пользователя
      // Но для этого нужно декодировать JWT или сделать запрос к API
      // Пока просто проверяем наличие токена
    }
    
    // Если это корневая страница, перенаправляем на /chat для обычных пользователей
    if (pathname === '/') {
      try {
        return NextResponse.redirect(new URL('/chat', request.url));
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