import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Проверяем, если это админская страница
  if (pathname.startsWith('/admin') || pathname.startsWith('/operator')) {
    // Получаем токен из cookies
    const token = request.cookies.get('access_token')?.value;
    
    if (!token) {
      // Если нет токена, перенаправляем на страницу входа
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Здесь можно добавить проверку роли пользователя
    // Но для этого нужно декодировать JWT или сделать запрос к API
    // Пока просто проверяем наличие токена
  }
  
  // Если это корневая страница, перенаправляем на /chat для обычных пользователей
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/chat', request.url));
  }
  
  return NextResponse.next();
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