'use client';

import { useState, useEffect, useRef } from 'react';
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
  Mail,
  ChevronDown
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types';
import * as Radix from '@radix-ui/themes';
import ThemeToggle from "../ThemeToggle"
import Link from 'next/link';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
  category?: string;
}

interface NavCategory {
  name: string;
  items: NavItem[];
  roles: UserRole[];
}

const mainNavigation: NavItem[] = [
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
  }
];

const adminManagementItems: NavItem[] = [
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
  }
];

const operatorItems: NavItem[] = [
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
  }
];

const userItems: NavItem[] = [
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
  }
];

const commonItems: NavItem[] = [
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
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getNavigationCategories = () => {
    const categories: NavCategory[] = [];
    
    // Main navigation items
    const filteredMain = mainNavigation.filter(item => 
      user?.role && item.roles.includes(user.role as UserRole)
    );
    
    // Dropdown categories based on user role
    if (user?.role === UserRole.ADMIN) {
      const filteredAdmin = adminManagementItems.filter(item => 
        item.roles.includes(user.role as UserRole)
      );
      if (filteredAdmin.length > 0) {
        categories.push({
          name: 'Управление',
          items: filteredAdmin,
          roles: [UserRole.ADMIN]
        });
      }
    }
    
    if (user?.role === UserRole.OPERATOR) {
      const filteredOperator = operatorItems.filter(item => 
        item.roles.includes(user.role as UserRole)
      );
      if (filteredOperator.length > 0) {
        categories.push({
          name: 'Мои задачи',
          items: filteredOperator,
          roles: [UserRole.OPERATOR]
        });
      }
    }
    
    if (user?.role === UserRole.VISITOR) {
      const filteredUser = userItems.filter(item => 
        item.roles.includes(user.role as UserRole)
      );
      if (filteredUser.length > 0) {
        categories.push({
          name: 'Мои данные',
          items: filteredUser,
          roles: [UserRole.VISITOR]
        });
      }
    }
    
    // Common items
    const filteredCommon = commonItems.filter(item => 
      user?.role && item.roles.includes(user.role as UserRole)
    );
    if (filteredCommon.length > 0) {
      categories.push({
        name: 'Общее',
        items: filteredCommon,
        roles: [UserRole.ADMIN, UserRole.OPERATOR, UserRole.VISITOR]
      });
    }
    
    return { mainItems: filteredMain, categories };
  };
  
  const { mainItems, categories } = getNavigationCategories();

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
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-lg font-semibold text-gray-900 dark:text-white">ChatSystem</Link>
            </div>
            
            {/* Desktop navigation */}
            <div className="hidden md:ml-8 md:flex md:items-center md:space-x-4">
              {/* Main navigation items */}
              {mainItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <button
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-black text-white dark:bg-black dark:text-white'
                        : 'text-black dark:text-black hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </button>
                );
              })}
              
              {/* Dropdown categories */}
              <div ref={dropdownRef} className="flex space-x-4">
                {categories.map((category) => {
                  const hasActiveItem = category.items.some(item => pathname === item.href);
                  return (
                    <div key={category.name} className="relative">
                      <button
                        onClick={() => setDropdownOpen(dropdownOpen === category.name ? null : category.name)}
                        className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          hasActiveItem
                            ? 'bg-black text-white dark:bg-white dark:text-black'
                            : 'text-black dark:text-black hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {category.name}
                        <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${
                          dropdownOpen === category.name ? 'rotate-180' : ''
                        }`} />
                      </button>
                      
                      {dropdownOpen === category.name && (
                        <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-md shadow-lg z-50">
                          {category.items.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                              <button
                                key={item.href}
                                onClick={() => {
                                  router.push(item.href);
                                  setDropdownOpen(null);
                                }}
                                className={`w-full flex items-center px-4 py-2 text-sm transition-colors first:rounded-t-md last:rounded-b-md ${
                                  isActive
                                    ? 'bg-black text-white dark:bg-white dark:text-black'
                                    : 'text-black dark:text-black hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                              >
                                <item.icon className="w-4 h-4 mr-3" />
                                {item.name}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* User menu */}
          <div className="flex items-center">
            {/* Theme toggle and User info */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              <ThemeToggle></ThemeToggle>
              
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
                className="p-2 text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-black hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
            {/* Main items */}
            {mainItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => {
                    router.push(item.href);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive
                      ? 'bg-black text-white dark:bg-black dark:text-black'
                      : 'text-black dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </button>
              );
            })}
            
            {/* Category items */}
            {categories.map((category) => (
              <div key={category.name} className="mt-4">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {category.name}
                </div>
                {category.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <button
                      key={item.href}
                      onClick={() => {
                        router.push(item.href);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center px-6 py-2 rounded-md text-base font-medium transition-colors ${
                        isActive
                          ? 'bg-white text-white dark:bg-black dark:text-black'
                          : 'text-black dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      {item.name}
                    </button>
                  );
                })}
              </div>
            ))}

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