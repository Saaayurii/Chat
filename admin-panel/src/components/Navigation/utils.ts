import { UserRole } from '@/types';
import { NavCategory } from './types';
import { getMainNavigation, adminManagementItems, operatorItems, userItems, commonItems } from './config';

export var getRoleColor = (role: string) => 
  role === 'ADMIN' ? "red" : role === 'OPERATOR' ? "blue" : "gray";

export var getRoleLabel = (role: string) => 
  role === 'ADMIN' ? "Администратор" : 
  role === 'OPERATOR' ? "Оператор" : 
  role === 'VISITOR' ? "Посетитель" : role;

export var getUserInitials = (user: any) => {
  return user?.profile?.fullName ? 
    user.profile.fullName
      .split(" ")
      .map((name: string) => name[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) :
    user?.profile?.username ? 
      user.profile.username.slice(0, 2).toUpperCase() :
      user?.email?.slice(0, 2).toUpperCase() || "U";
};

export var getNavigationCategories = (user: any) => {
  var categories: NavCategory[] = [];

  var mainNavigation = getMainNavigation(user?.role as keyof typeof UserRole);
  var filteredMain = mainNavigation.filter(
    (item) => user?.role && item.roles.includes(user.role as keyof typeof UserRole)
  );

  user?.role === 'ADMIN' ? 
    (() => {
      var filteredAdmin = adminManagementItems.filter((item) =>
        item.roles.includes(user.role as keyof typeof UserRole)
      );
      filteredAdmin.length > 0 ? 
        categories.push({
          name: "Управление",
          items: filteredAdmin,
          roles: ['ADMIN'],
        }) : null;
    })() : null;

  user?.role === 'OPERATOR' ? 
    (() => {
      var filteredOperator = operatorItems.filter((item) =>
        item.roles.includes(user.role as keyof typeof UserRole)
      );
      filteredOperator.length > 0 ? 
        categories.push({
          name: "Мои задачи",
          items: filteredOperator,
          roles: ['OPERATOR'],
        }) : null;
    })() : null;

  user?.role === 'VISITOR' ? 
    (() => {
      var filteredUser = userItems.filter((item) =>
        item.roles.includes(user.role as keyof typeof UserRole)
      );
      filteredUser.length > 0 ? 
        categories.push({
          name: "Мои данные",
          items: filteredUser,
          roles: ['VISITOR'],
        }) : null;
    })() : null;

  var filteredCommon = commonItems.filter(
    (item) => user?.role && item.roles.includes(user.role as keyof typeof UserRole)
  );
  filteredCommon.length > 0 ? 
    categories.push({
      name: "Общее",
      items: filteredCommon,
      roles: ['ADMIN', 'OPERATOR', 'VISITOR'],
    }) : null;

  return { mainItems: filteredMain, categories };
};