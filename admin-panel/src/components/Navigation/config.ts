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
import { UserRole } from '@/types';
import { NavItem } from './types';

export var getMainNavigation = (userRole: keyof typeof UserRole): NavItem[] => [
  {
    name: "Статистика",
    href: userRole === 'ADMIN' ? "/admin/statistics" : "/operator/statistics",
    icon: BarChart3,
    roles: ['ADMIN', 'OPERATOR'],
  },
  {
    name: "Сообщения",
    href: userRole === 'ADMIN' ? "/admin/chat" : userRole === 'OPERATOR' ? "/operator/chat" : "/chat",
    icon: MessageSquare,
    roles: ['ADMIN', 'OPERATOR', 'VISITOR'],
  },
  {
    name: "Сотрудники",
    href: "/admin/users",
    icon: Users,
    roles: ['ADMIN'],
  },
  {
    name: "Посетители",
    href: "/admin/visitors",
    icon: User,
    roles: ['ADMIN'],
  },
];

export var adminManagementItems: NavItem[] = [
  {
    name: "Вопросы",
    href: "/admin/questions",
    icon: HelpCircle,
    roles: ['ADMIN'],
  },
  {
    name: "Жалобы",
    href: "/admin/complaints",
    icon: AlertTriangle,
    roles: ['ADMIN'],
  },
  {
    name: "Черный список",
    href: "/admin/blacklist",
    icon: Ban,
    roles: ['ADMIN'],
  },
  {
    name: "Оценки",
    href: "/admin/ratings",
    icon: Star,
    roles: ['ADMIN'],
  },
  {
    name: "Email уведомления",
    href: "/admin/emails",
    icon: Mail,
    roles: ['ADMIN'],
  },
];

export var operatorItems: NavItem[] = [
  {
    name: "Коллеги",
    href: "/operator/colleagues",
    icon: Users,
    roles: ['OPERATOR'],
  },
  {
    name: "Мои вопросы",
    href: "/operator/questions",
    icon: HelpCircle,
    roles: ['OPERATOR'],
  },
  {
    name: "Мои оценки",
    href: "/operator/ratings",
    icon: Star,
    roles: ['OPERATOR'],
  },
];

export var userItems: NavItem[] = [];

export var commonItems: NavItem[] = [
  {
    name: "Профиль",
    href: "/profile",
    icon: User,
    roles: ['ADMIN', 'OPERATOR', 'VISITOR'],
  },
  {
    name: "Настройки",
    href: "/settings",
    icon: Settings,
    roles: ['ADMIN', 'OPERATOR'],
  },
];