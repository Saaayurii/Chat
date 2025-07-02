'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  BarChart3, 
  MessageSquare, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  User,
  Shield,
  HelpCircle,
  AlertTriangle,
  Ban,
  Star,
  Mail
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types';
import * as Radix from '@radix-ui/themes';
import ThemeToggle from '@/components/ThemeToggle';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const navigation: NavItem[] = [
  {
    name: 'Статистика',
    href: '/admin/statistics',
    icon: BarChart3,
    roles: [UserRole.ADMIN, UserRole.OPERATOR]
  },
  {
    name: 'Чат',
    href: '/chat',
    icon: MessageSquare,
    roles: [UserRole.ADMIN, UserRole.OPERATOR, UserRole.VISITOR]
  },
  {
    name: 'Пользователи',
    href: '/admin/users',
    icon: Users,
    roles: [UserRole.ADMIN]
  },
  // Admin-specific management pages
  {
    name: 'Вопросы',
    href: '/admin/questions',
    icon: HelpCircle,
    roles: [UserRole.ADMIN]
  },
  {
    name: 'Жалобы',
    href: '/admin/complaints',
    icon: AlertTriangle,
    roles: [UserRole.ADMIN]
  },
  {
    name: 'Черный список',
    href: '/admin/blacklist',
    icon: Ban,
    roles: [UserRole.ADMIN]
  },
  {
    name: 'Оценки',
    href: '/admin/ratings',
    icon: Star,
    roles: [UserRole.ADMIN]
  },
  {
    name: 'Email уведомления',
    href: '/admin/emails',
    icon: Mail,
    roles: [UserRole.ADMIN]
  },
  // Operator-specific pages
  {
    name: 'Мои вопросы',
    href: '/operator/questions',
    icon: HelpCircle,
    roles: [UserRole.OPERATOR]
  },
  {
    name: 'Мои оценки',
    href: '/operator/ratings',
    icon: Star,
    roles: [UserRole.OPERATOR]
  },
  // User-specific pages
  {
    name: 'Мои вопросы',
    href: '/user/questions',
    icon: HelpCircle,
    roles: [UserRole.VISITOR]
  },
  {
    name: 'Мои жалобы',
    href: '/user/complaints',
    icon: AlertTriangle,
    roles: [UserRole.VISITOR]
  },
  {
    name: 'Мои оценки',
    href: '/user/ratings',
    icon: Star,
    roles: [UserRole.VISITOR]
  },
  // Common pages
  {
    name: 'Профиль',
    href: '/profile',
    icon: User,
    roles: [UserRole.ADMIN, UserRole.OPERATOR, UserRole.VISITOR]
  },
  {
    name: 'Настройки',
    href: '/settings',
    icon: Settings,
    roles: [UserRole.ADMIN, UserRole.OPERATOR]
  }
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const filteredNavigation = navigation.filter(item => 
    user?.role && item.roles.includes(user.role as UserRole)
  );

  const getRoleColor = (role: string) => {
    return role === UserRole.ADMIN ? 'red' : role === UserRole.OPERATOR ? 'blue' : 'gray';
  };

  const getRoleLabel = (role: string) => {
    return role === UserRole.ADMIN ? 'Администратор' : role === UserRole.OPERATOR ? 'Оператор' : role === UserRole.VISITOR ? 'Посетитель' : role;
  };

  return !user ? null : (
    <nav className="bg-white dark:bg-dark-950 shadow-sm border-b border-gray-200 dark:border-dark-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and navigation */}
          <div className="flex overflow-x-auto">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-lg font-semibold text-gray-900">ChatSystem</h1>
            </div>
            
            {/* Desktop navigation */}
            <div className="hidden md:ml-8 md:flex md:space-x-4">
              {filteredNavigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <button
                    key={item.href} // Use href as key to avoid duplicates
                    onClick={() => router.push(item.href)}
                    className={`inline-flex items-center px-2 pt-1 border-b-2 text-xs font-medium transition-colors ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <item.icon className="w-3 h-3 mr-1" />
                    {item.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* User menu */}
          <div className="flex items-center">
            {/* Theme toggle and User info */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              <ThemeToggle />
              
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-200 dark:bg-dark-800 rounded-full flex items-center justify-center">
                  {user.profile?.avatarUrl ? (
                    <img
                      src={user.profile.avatarUrl}
                      alt={user.profile.fullName || user.profile.username}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <span className="text-sm font-medium text-gray-600 dark:text-dark-300">
                      {((user.profile?.fullName || user.profile?.username || user.email) ?? '').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900 ">
                    {user.email || user.profile?.username || 'Пользователь'}
                  </span>
                  <Radix.Badge 
                    color={getRoleColor(user.role) as any} 
                    variant="soft" 
                    size="1"
                  >
                    {getRoleLabel(user.role)}
                  </Radix.Badge>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Выйти"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile theme toggle */}
            <div className="md:hidden mr-2">
              <ThemeToggle />
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen ? (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            {/* User info mobile */}
            <div className="flex items-center px-3 py-3 border-b border-gray-200 mb-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                {user.profile?.avatarUrl ? (
                  <img
                    src={user.profile.avatarUrl}
                    alt={user.profile.fullName || user.profile.username}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <span className="text-sm font-medium text-gray-600">
                    {((user.profile?.fullName || user.profile?.username || user.email) ?? '').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <div className="text-base font-medium text-gray-900">
                  {user.profile?.fullName || user.profile?.username || 'Пользователь'}
                </div>
                <div className="text-sm text-gray-500">{user.email}</div>
                <Radix.Badge 
                  color={getRoleColor(user.role) as any} 
                  variant="soft" 
                  size="1"
                  className="mt-1"
                >
                  {getRoleLabel(user.role)}
                </Radix.Badge>
              </div>
            </div>

            {/* Navigation items mobile */}
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.href} // Use href as key to avoid duplicates
                  onClick={() => {
                    router.push(item.href);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </button>
              );
            })}

            {/* Logout mobile */}
            <button
              onClick={() => {
                handleLogout();
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center px-3 py-2 rounded-md text-base font-medium text-red-700 hover:text-red-900 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Выйти
            </button>
          </div>
        </div>
      ) : null}
    </nav>
  );
}