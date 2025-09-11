import { UserRole } from '@/types';
import { NavCategory } from './types';
import { getMainNavigation, adminManagementItems, operatorItems, userItems, commonItems } from './config';

export var getRoleColor = (role: string) => 
  role === 'admin' ? "red" : role === 'operator' ? "blue" : "gray";

export var getRoleLabel = (role: string) => 
  role === 'admin' ? "Администратор" : 
  role === 'operator' ? "Оператор" : 
  role === 'visitor' ? "Посетитель" : role;

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

  user?.role === 'admin' ? 
    (() => {
      var filteredAdmin = adminManagementItems.filter((item) =>
        item.roles.includes(user.role as keyof typeof UserRole)
      );
      filteredAdmin.length > 0 ? 
        categories.push({
          name: "Управление",
          items: filteredAdmin,
          roles: ['admin'],
        }) : null;
    })() : null;

  user?.role === 'operator' ? 
    (() => {
      var filteredOperator = operatorItems.filter((item) =>
        item.roles.includes(user.role as keyof typeof UserRole)
      );
      filteredOperator.length > 0 ? 
        categories.push({
          name: "Мои задачи",
          items: filteredOperator,
          roles: ['operator'],
        }) : null;
    })() : null;

  user?.role === 'visitor' ? 
    (() => {
      var filteredUser = userItems.filter((item) =>
        item.roles.includes(user.role as keyof typeof UserRole)
      );
      filteredUser.length > 0 ? 
        categories.push({
          name: "Мои данные",
          items: filteredUser,
          roles: ['visitor'],
        }) : null;
    })() : null;

  var filteredCommon = commonItems.filter(
    (item) => user?.role && item.roles.includes(user.role as keyof typeof UserRole)
  );
  filteredCommon.length > 0 ? 
    categories.push({
      name: "Общее",
      items: filteredCommon,
      roles: ['admin', 'operator', 'visitor'],
    }) : null;

  return { mainItems: filteredMain, categories };
};