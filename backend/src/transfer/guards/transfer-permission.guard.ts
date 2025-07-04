import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRoles } from '../../common/enums/user-roles.enum';

@Injectable()
export class TransferPermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Пользователь не авторизован');
    }

    const userRole = user.role;
    const userId = user.id;

    const requiredRoles = this.reflector.get<UserRoles[]>('roles', context.getHandler());
    
    if (requiredRoles && requiredRoles.includes(userRole)) {
      return true;
    }

    const transferData = request.body;
    
    if (userRole === UserRoles.ADMIN) {
      return true;
    }

    if (userRole === UserRoles.OPERATOR) {
      if (transferData.fromOperatorId && transferData.fromOperatorId !== userId) {
        throw new ForbiddenException('Оператор может передавать только свои чаты');
      }
      
      if (transferData.toOperatorId && transferData.toOperatorId === userId) {
        throw new ForbiddenException('Оператор не может передавать чат самому себе');
      }

      return true;
    }

    throw new ForbiddenException('Недостаточно прав для выполнения операции');
  }
}