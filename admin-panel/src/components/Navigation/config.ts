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
    href: userRole === 'admin' ? "/admin/statistics" : "/operator/statistics",
    icon: BarChart3,
    roles: ['admin', 'operator'],
  },
  {
    name: "Сообщения",
    href: userRole === 'admin' ? "/admin/chat" : userRole === 'operator' ? "/operator/chat" : "/chat",
    icon: MessageSquare,
    roles: ['admin', 'operator', 'visitor'],
  },
  {
    name: "Сотрудники",
    href: "/admin/users",
    icon: Users,
    roles: ['admin'],
  },
  {
    name: "Посетители",
    href: "/admin/visitors",
    icon: User,
    roles: ['admin'],
  },
];

export var adminManagementItems: NavItem[] = [
  {
    name: "Вопросы",
    href: "/admin/questions",
    icon: HelpCircle,
    roles: ['admin'],
  },
  {
    name: "Жалобы",
    href: "/admin/complaints",
    icon: AlertTriangle,
    roles: ['admin'],
  },
  {
    name: "Черный список",
    href: "/admin/blacklist",
    icon: Ban,
    roles: ['admin'],
  },
  {
    name: "Оценки",
    href: "/admin/ratings",
    icon: Star,
    roles: ['admin'],
  },
  {
    name: "Email уведомления",
    href: "/admin/emails",
    icon: Mail,
    roles: ['admin'],
  },
];

export var operatorItems: NavItem[] = [
  {
    name: "Коллеги",
    href: "/operator/colleagues",
    icon: Users,
    roles: ['operator'],
  },
  {
    name: "Мои вопросы",
    href: "/operator/questions",
    icon: HelpCircle,
    roles: ['operator'],
  },
  {
    name: "Мои оценки",
    href: "/operator/ratings",
    icon: Star,
    roles: ['operator'],
  },
];

export var userItems: NavItem[] = [];

export var commonItems: NavItem[] = [
  {
    name: "Профиль",
    href: "/profile",
    icon: User,
    roles: ['admin', 'operator', 'visitor'],
  },
  {
    name: "Настройки",
    href: "/settings",
    icon: Settings,
    roles: ['admin', 'operator'],
  },
];