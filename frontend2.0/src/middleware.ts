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
      
      // Если нет токена в cookies, возможно это первый запрос после логина
      // В этом случае позволяем пройти и позволяем клиенту обработать аутентификацию
      if (!cookieToken) {
        // Проверяем, это не запрос на статические ресурсы
        if (pathname.includes('/_next/') || pathname.includes('/api/')) {
          return NextResponse.next();
        }
        
        // Логируем для отладки
        console.log('No token found for protected route:', pathname);
        
        // Если нет токена и это не специальные пути, перенаправляем на страницу входа
        // Но даем возможность клиенту обработать аутентификацию
        return NextResponse.next();
      }
      
      console.log('Token found for protected route:', pathname);
    }

    // Блокируем доступ обычных пользователей к /profile и /chat
    if (pathname === '/profile' || pathname === '/chat') {
      return NextResponse.redirect(new URL('/widget-demo', request.url));
    }
    
    // Если это корневая страница, перенаправляем на /widget-demo для обычных пользователей
    if (pathname === '/') {
      try {
        return NextResponse.redirect(new URL('/widget-demo', request.url));
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