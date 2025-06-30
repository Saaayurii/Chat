import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../database/schemas/user.schema';

@Injectable()
export class OwnerGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Администратор имеет доступ ко всем ресурсам
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Получаем ID ресурса из параметров запроса
    const resourceId = this.getResourceId(request);
    
    if (!resourceId) {
      throw new ForbiddenException('Resource ID not found');
    }

    // Проверяем владение ресурсом
    const isOwner = this.checkOwnership(user, resourceId, request);
    
    if (!isOwner) {
      throw new ForbiddenException('Access denied: you can only access your own resources');
    }

    return true;
  }

  private getResourceId(request: any): string | null {
    // Пытаемся получить ID из разных источников
    const params = request.params;
    const body = request.body;
    const query = request.query;

    // Проверяем наиболее распространенные названия параметров
    return (
      params?.id ||
      params?.userId ||
      params?.profileId ||
      body?.userId ||
      query?.userId ||
      null
    );
  }

  private checkOwnership(user: any, resourceId: string, request: any): boolean {
    // Основная проверка - сравниваем ID пользователя с ID ресурса
    if (user.id === resourceId || user.sub === resourceId) {
      return true;
    }

    // Дополнительные проверки в зависимости от маршрута
    const route = request.route?.path || '';
    
    // Для профилей пользователей
    if (route.includes('/profile') || route.includes('/users')) {
      return user.id === resourceId || user.sub === resourceId;
    }

    // Для сообщений и бесед - проверяем через senderId или участников
    if (route.includes('/messages') || route.includes('/conversations')) {
      // Здесь можно добавить более сложную логику проверки участия в беседе
      // Пока оставляем базовую проверку владения
      return user.id === resourceId || user.sub === resourceId;
    }

    return false;
  }
}
