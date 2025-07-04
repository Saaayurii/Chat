'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useQuery } from '@tanstack/react-query';
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
  ChevronDown,
  Moon,
  Sun
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types';
import { chatAPI } from '@/core/api';
import * as Radix from '@radix-ui/themes';
import Link from 'next/link';

import  Button from '@/components/UI/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/UI/Avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/UI/DropdownMenu';
import { Badge } from '../UI';

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
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Получаем количество непрочитанных сообщений для админа
  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await chatAPI.getConversations();
      return response.data;
    },
    enabled: user?.role === UserRole.ADMIN,
    refetchInterval: 30000, // Обновляем каждые 30 секунд
  });

  // Подсчитываем общее количество непрочитанных сообщений
  const totalUnreadMessages = useMemo(() => {
    if (!conversations || !Array.isArray(conversations)) return 0;
    return conversations.reduce((total, conv) => total + (conv.unreadMessagesCount || 0), 0);
  }, [conversations]);
  
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

  const handleProfile = () => {
    router.push('/profile');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const getUserInitials = () => {
    if (user?.profile?.fullName) {
      return user.profile.fullName
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.profile?.username) {
      return user.profile.username.slice(0, 2).toUpperCase();
    }
    return user?.email?.slice(0, 2).toUpperCase() || 'U';
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
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and navigation */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" className="text-lg font-semibold text-foreground">
                ChatSystem
              </Link>
            </div>
            
            {/* Desktop navigation */}
            <div className="hidden md:ml-8 md:flex md:items-center md:space-x-1">
              {/* Main navigation items */}
              {mainItems.map((item) => {
                const isActive = pathname === item.href;
                const isChatItem = item.href === '/chat';
                const showBadge = isChatItem && user?.role === UserRole.ADMIN && totalUnreadMessages > 0;
                
                return (
                  <Button
                    key={item.href}
                    variant={isActive ? "default" : "ghost"}
                    onClick={() => router.push(item.href)}
                    className="flex items-center space-x-2 relative"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                    {showBadge && (
                      <Badge 
                        variant="destructive" 
                        className="h-5 w-5 p-0 text-xs flex items-center justify-center absolute -top-1 -right-1"
                      >
                        {totalUnreadMessages}
                      </Badge>
                    )}
                  </Button>
                );
              })}
              
              {/* Dropdown categories */}
              <div ref={dropdownRef} className="flex space-x-1">
                {categories.map((category) => {
                  const hasActiveItem = category.items.some(item => pathname === item.href);
                  return (
                    <div key={category.name} className="relative">
                      <Button
                        variant={hasActiveItem ? "default" : "ghost"}
                        onClick={() => setDropdownOpen(dropdownOpen === category.name ? null : category.name)}
                        className="flex items-center space-x-1"
                      >
                        <span>{category.name}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${
                          dropdownOpen === category.name ? 'rotate-180' : ''
                        }`} />
                      </Button>
                      
                      {dropdownOpen === category.name && (
                        <div className="absolute top-full left-0 mt-1 w-48 bg-background border border-border rounded-md shadow-lg z-50">
                          {category.items.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                              <button
                                key={item.href}
                                onClick={() => {
                                  router.push(item.href);
                                  setDropdownOpen(null);
                                }}
                                className={`w-full flex items-center px-4 py-2 text-sm transition-colors first:rounded-t-md last:rounded-b-md hover:bg-accent ${
                                  isActive ? 'bg-accent' : ''
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

          {/* Right side menu */}
          <div className="flex items-center space-x-4">
            {/* Theme toggle - только на больших экранах */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="hidden lg:flex"
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Переключить тему</span>
            </Button>

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profile?.avatarUrl} alt={user?.profile?.username || user?.email} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.profile?.fullName || user?.profile?.username || 'Пользователь'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                    <Radix.Badge 
                      color={getRoleColor(user.role) as any} 
                      variant="soft" 
                      size="1"
                      className="mt-1 w-fit"
                    >
                      {getRoleLabel(user.role)}
                    </Radix.Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleProfile}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Профиль</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={toggleTheme}
                  className="lg:hidden"
                >
                  {theme === 'dark' ? (
                    <Sun className="mr-2 h-4 w-4" />
                  ) : (
                    <Moon className="mr-2 h-4 w-4" />
                  )}
                  <span>
                    {theme === 'dark' ? 'Светлая тема' : 'Темная тема'}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Выход</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {/* User info mobile */}
            <div className="flex items-center px-3 py-3 border-b border-border mb-3">
              <Avatar className="h-10 w-10 mr-3">
                <AvatarImage src={user?.profile?.avatarUrl} alt={user?.profile?.username || user?.email} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="text-base font-medium text-foreground">
                  {user.profile?.fullName || user.profile?.username || 'Пользователь'}
                </div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
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
              const isChatItem = item.href === '/chat';
              const showBadge = isChatItem && user?.role === UserRole.ADMIN && totalUnreadMessages > 0;
              
              return (
                <Button
                  key={item.href}
                  variant={isActive ? "default" : "ghost"}
                  onClick={() => {
                    router.push(item.href);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full justify-start mb-1 relative"
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                  {showBadge && (
                    <Badge 
                      variant="destructive" 
                      className="h-5 w-5 p-0 text-xs flex items-center justify-center ml-auto"
                    >
                      {totalUnreadMessages}
                    </Badge>
                  )}
                </Button>
              );
            })}
            
            {/* Category items */}
            {categories.map((category) => (
              <div key={category.name} className="mt-4">
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {category.name}
                </div>
                {category.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Button
                      key={item.href}
                      variant={isActive ? "default" : "ghost"}
                      onClick={() => {
                        router.push(item.href);
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full justify-start ml-3 mb-1"
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      {item.name}
                    </Button>
                  );
                })}
              </div>
            ))}

            {/* Theme toggle mobile */}
            <Button
              variant="ghost"
              onClick={() => {
                toggleTheme();
              }}
              className="w-full justify-start mt-4"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 mr-3" />
              ) : (
                <Moon className="w-5 h-5 mr-3" />
              )}
              {theme === 'dark' ? 'Светлая тема' : 'Темная тема'}
            </Button>

            {/* Profile mobile */}
            <Button
              variant="ghost"
              onClick={() => {
                handleProfile();
                setIsMobileMenuOpen(false);
              }}
              className="w-full justify-start"
            >
              <User className="w-5 h-5 mr-3" />
              Профиль
            </Button>

            {/* Logout mobile */}
            <Button
              variant="ghost"
              onClick={() => {
                handleLogout();
                setIsMobileMenuOpen(false);
              }}
              className="w-full justify-start text-destructive hover:text-destructive"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Выйти
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}