# Authentication Flow

## Обзор системы аутентификации

Система аутентификации работает в два этапа:

1. **Server-side (Middleware)** - Первичная проверка токена в cookies
2. **Client-side (ProtectedRoute)** - Детальная проверка аутентификации и ролей

## Компоненты

### 1. AuthStore (`/store/authStore.ts`)
- Управляет состоянием аутентификации
- Сохраняет токены в localStorage И cookies
- Предоставляет методы для входа/выхода

### 2. AuthInitializer (`/components/AuthInitializer.tsx`)
- Инициализирует состояние аутентификации при загрузке приложения
- Восстанавливает токены из localStorage
- Синхронизирует cookies с localStorage

### 3. ProtectedRoute (`/components/ProtectedRoute.tsx`)
- Защищает страницы на клиенте
- Проверяет роли пользователей
- Перенаправляет на соответствующие страницы

### 4. Middleware (`/middleware.ts`)
- Обеспечивает базовую защиту на сервере
- Проверяет наличие токена в cookies
- Логирует попытки доступа к защищенным маршрутам

## Защищенные маршруты

### Admin маршруты
- `/admin/statistics` - Статистика (только админы)
- `/admin/chat` - Чат администратора
- `/admin/visitors` - Управление посетителями
- `/admin/users` - Управление сотрудниками

### Operator маршруты
- `/operator/chat` - Чат оператора
- `/operator/colleagues` - Список коллег
- `/operator/statistics` - Статистика оператора

## Как работает аутентификация

1. **Вход в систему:**
   - Пользователь входит через `/login`
   - Токен сохраняется в localStorage
   - Токен также сохраняется в cookies для middleware
   - Состояние аутентификации обновляется в store

2. **Доступ к защищенным страницам:**
   - Middleware проверяет токен в cookies
   - ProtectedRoute проверяет роли на клиенте
   - При несоответствии ролей происходит перенаправление

3. **Выход из системы:**
   - Токены удаляются из localStorage
   - Cookies очищаются
   - Состояние аутентификации сбрасывается

## Отладка

Если аутентификация не работает:

1. Проверьте консоль на наличие ошибок
2. Убедитесь, что токен сохранен в localStorage
3. Проверьте, что cookies установлены правильно
4. Убедитесь, что роль пользователя соответствует странице

## Использование

Для защиты новой страницы:

```tsx
import ProtectedRoute from '@/components/ProtectedRoute';
import { UserRole } from '@/types';

export default function MyProtectedPage() {
  return (
    <ProtectedRoute requiredRole={UserRole.ADMIN}>
      <MyPageContent />
    </ProtectedRoute>
  );
}
```