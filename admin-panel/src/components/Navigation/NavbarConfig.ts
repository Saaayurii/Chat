import {
  BarChart3,
  MessageSquare,
  Users,
  Settings,
  User,
  HelpCircle,
  AlertTriangle,
  Ban,
  Star,
  Mail,
} from "lucide-react";
import { UserRole } from "@/types";

export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: typeof UserRole[keyof typeof UserRole][];
  category?: string;
}

export interface NavCategory {
  name: string;
  items: NavItem[];
  roles: typeof UserRole[keyof typeof UserRole][];
}

export var getMainNavigation = (userRole: typeof UserRole[keyof typeof UserRole]): NavItem[] => [
  {
    name: "Статистика",
    href: userRole === UserRole.ADMIN ? "/admin/statistics" : "/operator/statistics",
    icon: BarChart3,
    roles: [UserRole.ADMIN, UserRole.OPERATOR],
  },
  {
    name: "Сообщения",
    href: userRole === UserRole.ADMIN ? "/admin/chat" :
          userRole === UserRole.OPERATOR ? "/operator/chat" : "/chat",
    icon: MessageSquare,
    roles: [UserRole.ADMIN, UserRole.OPERATOR, UserRole.VISITOR],
  },
  {
    name: "Сотрудники",
    href: "/admin/users",
    icon: Users,
    roles: [UserRole.ADMIN],
  },
  {
    name: "Посетители",
    href: "/admin/visitors",
    icon: User,
    roles: [UserRole.ADMIN],
  },
];

export var adminManagementItems: NavItem[] = [
  {
    name: "Вопросы",
    href: "/admin/questions",
    icon: HelpCircle,
    roles: [UserRole.ADMIN],
  },
  {
    name: "Жалобы",
    href: "/admin/complaints",
    icon: AlertTriangle,
    roles: [UserRole.ADMIN],
  },
  {
    name: "Черный список",
    href: "/admin/blacklist",
    icon: Ban,
    roles: [UserRole.ADMIN],
  },
  {
    name: "Оценки",
    href: "/admin/ratings",
    icon: Star,
    roles: [UserRole.ADMIN],
  },
  {
    name: "Email уведомления",
    href: "/admin/emails",
    icon: Mail,
    roles: [UserRole.ADMIN],
  },
];

export var operatorItems: NavItem[] = [
  {
    name: "Коллеги",
    href: "/operator/colleagues",
    icon: Users,
    roles: [UserRole.OPERATOR],
  },
  {
    name: "Мои вопросы",
    href: "/operator/questions",
    icon: HelpCircle,
    roles: [UserRole.OPERATOR],
  },
  {
    name: "Мои оценки",
    href: "/operator/ratings",
    icon: Star,
    roles: [UserRole.OPERATOR],
  },
];

export var userItems: NavItem[] = [];

export var commonItems: NavItem[] = [
  {
    name: "Профиль",
    href: "/profile",
    icon: User,
    roles: [UserRole.ADMIN, UserRole.OPERATOR, UserRole.VISITOR],
  },
  {
    name: "Настройки",
    href: "/settings",
    icon: Settings,
    roles: [UserRole.ADMIN, UserRole.OPERATOR],
  },
];

export var getRoleColor = (role: string): string =>
  role === UserRole.ADMIN ? "red" :
  role === UserRole.OPERATOR ? "blue" : "gray";

export var getRoleLabel = (role: string): string =>
  role === UserRole.ADMIN ? "Администратор" :
  role === UserRole.OPERATOR ? "Оператор" :
  role === UserRole.VISITOR ? "Посетитель" : role;