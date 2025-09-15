"use client";

import { useRouter, usePathname } from "next/navigation";
import { Moon, Sun, User, LogOut } from "lucide-react";
import { UserRole } from "@/types";
import Button from "@/components/UI/Button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/UI/Avatar";
import { Badge } from "../UI";
import * as Radix from "@radix-ui/themes";
import { NavItem, NavCategory, getRoleColor, getRoleLabel } from "./NavbarConfig";

interface NavbarMobileProps {
  isOpen: boolean;
  mainItems: NavItem[];
  categories: NavCategory[];
  totalUnreadCount: number;
  user: {
    role: typeof UserRole[keyof typeof UserRole];
    email?: string;
    profile?: {
      fullName?: string;
      username?: string;
      avatarUrl?: string;
    };
  } | null;
  theme: string | undefined;
  userInitials: string;
  onCloseMobile: () => Promise<void>;
  onToggleTheme: () => Promise<void>;
  onLogout: () => Promise<void>;
  onProfile: () => Promise<void>;
}

export var NavbarMobile = ({
  isOpen,
  mainItems,
  categories,
  totalUnreadCount,
  user,
  theme,
  userInitials,
  onCloseMobile,
  onToggleTheme,
  onLogout,
  onProfile,
}: NavbarMobileProps) => {
  var router = useRouter();
  var pathname = usePathname();

  var handleItemClick = (href: string) => new Promise<void>((resolve) => {
    router.push(href);
    onCloseMobile().then(() => resolve());
  });

  var handleThemeToggle = () => new Promise<void>((resolve) => {
    onToggleTheme().then(() => resolve());
  });

  var handleProfileClick = () => new Promise<void>((resolve) => {
    onProfile().then(() => onCloseMobile()).then(() => resolve());
  });

  var handleLogoutClick = () => new Promise<void>((resolve) => {
    onLogout().then(() => onCloseMobile()).then(() => resolve());
  });

  return isOpen ? (
    <div className="md:hidden border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="px-2 pt-2 pb-3 space-y-1">
        <div className="flex items-center px-3 py-3 border-b border-border mb-3">
          <Avatar className="h-10 w-10 mr-3">
            <AvatarImage
              src={user?.profile?.avatarUrl}
              alt={user?.profile?.username || user?.email}
            />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="text-base font-medium text-foreground">
              {user?.profile?.fullName || user?.profile?.username || "Пользователь"}
            </div>
            <div className="text-sm text-muted-foreground">
              {user?.email}
            </div>
            <Radix.Badge
              color={getRoleColor(user?.role || "") as any}
              variant="soft"
              size="1"
              className="mt-1"
            >
              {getRoleLabel(user?.role || "")}
            </Radix.Badge>
          </div>
        </div>

        {mainItems.map((item) => {
          var isActive = pathname === item.href;
          var isChatItem = item.name === "Сообщения";
          var showBadge = isChatItem &&
            (user?.role === UserRole.ADMIN || user?.role === UserRole.OPERATOR) &&
            totalUnreadCount > 0;

          return (
            <Button
              key={item.href}
              variant={isActive ? "default" : "ghost"}
              onClick={() => handleItemClick(item.href)}
              className="w-full justify-start mb-1 relative"
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
              {showBadge && (
                <Badge
                  variant="destructive"
                  className="h-5 w-5 p-0 text-xs flex items-center justify-center ml-auto"
                >
                  {totalUnreadCount}
                </Badge>
              )}
            </Button>
          );
        })}

        {categories.map((category) => (
          <div key={category.name} className="mt-4">
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {category.name}
            </div>
            {category.items.map((item) => {
              var isActive = pathname === item.href;
              
              return (
                <Button
                  key={item.href}
                  variant={isActive ? "default" : "ghost"}
                  onClick={() => handleItemClick(item.href)}
                  className="w-full justify-start ml-3 mb-1"
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Button>
              );
            })}
          </div>
        ))}

        <Button
          variant="ghost"
          onClick={handleThemeToggle}
          className="w-full justify-start mt-4"
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5 mr-3" />
          ) : (
            <Moon className="w-5 h-5 mr-3" />
          )}
          {theme === "dark" ? "Светлая тема" : "Темная тема"}
        </Button>

        <Button
          variant="ghost"
          onClick={handleProfileClick}
          className="w-full justify-start"
        >
          <User className="w-5 h-5 mr-3" />
          Профиль
        </Button>

        <Button
          variant="ghost"
          onClick={handleLogoutClick}
          className="w-full justify-start text-destructive hover:text-destructive"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Выйти
        </Button>
      </div>
    </div>
  ) : null;
};