import { UserRole } from "@/types";
import { 
  getMainNavigation, 
  adminManagementItems, 
  operatorItems, 
  userItems, 
  commonItems,
  NavCategory,
  NavItem 
} from "./NavbarConfig";

interface User {
  role: UserRole;
  profile?: {
    fullName?: string;
    username?: string;
    avatarUrl?: string;
  };
  email?: string;
}

export var useNavbarUtils = (user: User | null) => {

  var getUserInitials = () => new Promise<string>((resolve) => {
    user?.profile?.fullName ? resolve(
      user.profile.fullName
        .split(" ")
        .map((name) => name[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    ) : user?.profile?.username ? resolve(
      user.profile.username.slice(0, 2).toUpperCase()
    ) : resolve(user?.email?.slice(0, 2).toUpperCase() || "U");
  });

  var getNavigationCategories = () => new Promise<{ mainItems: NavItem[]; categories: NavCategory[] }>((resolve) => {
    var categories: NavCategory[] = [];
    var mainNavigation = getMainNavigation(user?.role as UserRole);
    var filteredMain = mainNavigation.filter(
      (item) => user?.role && item.roles.includes(user.role as UserRole)
    );

    user?.role === UserRole.ADMIN ? (() => {
      var filteredAdmin = adminManagementItems.filter((item) =>
        item.roles.includes(user.role as UserRole)
      );
      filteredAdmin.length > 0 ? categories.push({
        name: "Управление",
        items: filteredAdmin,
        roles: [UserRole.ADMIN],
      }) : null;
    })() : null;

    user?.role === UserRole.OPERATOR ? (() => {
      var filteredOperator = operatorItems.filter((item) =>
        item.roles.includes(user.role as UserRole)
      );
      filteredOperator.length > 0 ? categories.push({
        name: "Мои задачи",
        items: filteredOperator,
        roles: [UserRole.OPERATOR],
      }) : null;
    })() : null;

    user?.role === UserRole.VISITOR ? (() => {
      var filteredUser = userItems.filter((item) =>
        item.roles.includes(user.role as UserRole)
      );
      filteredUser.length > 0 ? categories.push({
        name: "Мои данные",
        items: filteredUser,
        roles: [UserRole.VISITOR],
      }) : null;
    })() : null;

    var filteredCommon = commonItems.filter(
      (item) => user?.role && item.roles.includes(user.role as UserRole)
    );
    
    filteredCommon.length > 0 ? categories.push({
      name: "Общее",
      items: filteredCommon,
      roles: [UserRole.ADMIN, UserRole.OPERATOR, UserRole.VISITOR],
    }) : null;

    resolve({ mainItems: filteredMain, categories });
  });

  var getLogoClickPath = () => new Promise<string>((resolve) => {
    !user ? resolve("/login") :
    user.role === UserRole.ADMIN ? resolve("/admin/statistics") :
    user.role === UserRole.OPERATOR ? resolve("/operator/statistics") :
    resolve("/login");
  });

  return {
    getUserInitials,
    getNavigationCategories,
    getLogoClickPath
  };
};