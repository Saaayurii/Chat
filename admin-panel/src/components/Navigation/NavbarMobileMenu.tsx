"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { LogOut, User, Sun, Moon } from "lucide-react";
import Button from "@/components/UI/Button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/UI/Avatar";
import { Badge } from "@/components/UI";
import * as Radix from "@radix-ui/themes";
import { NavCategory, NavItem } from "./types";
import { getUserInitials, getRoleColor, getRoleLabel } from "./utils";

interface NavbarMobileMenuProps {
  mainItems: NavItem[];
  categories: NavCategory[];
  user: any;
  totalUnreadCount: number;
  logout: () => void;
  closeMobileMenu: () => void;
}

export var NavbarMobileMenu = ({ 
  mainItems, 
  categories, 
  user, 
  totalUnreadCount, 
  logout,
  closeMobileMenu 
}: NavbarMobileMenuProps) => {
  var router = useRouter();
  var pathname = usePathname();
  var { theme, setTheme } = useTheme();

  var handleLogout = () => {
    logout();
    closeMobileMenu();
  };

  var handleProfile = () => {
    router.push("/profile");
    closeMobileMenu();
  };

  var toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="md:hidden border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="px-2 pt-2 pb-3 space-y-1">
        <div className="flex items-center px-3 py-3 border-b border-border mb-3">
          <Avatar className="h-10 w-10 mr-3">
            <AvatarImage
              src={user?.profile?.avatarUrl}
              alt={user?.profile?.username || user?.email}
            />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getUserInitials(user)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="text-base font-medium text-foreground">
              {user.profile?.fullName ||
                user.profile?.username ||
                "Пользователь"}
            </div>
            <div className="text-sm text-muted-foreground">
              {user.email}
            </div>
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

        {mainItems.map((item) => {
          var isActive = pathname === item.href;
          var isChatItem = item.name === "Сообщения";
          var showBadge = isChatItem &&
            (user?.role === 'admin' || user?.role === 'operator') &&
            totalUnreadCount > 0;

          return (
            <Button
              key={item.href}
              variant={isActive ? "default" : "ghost"}
              onClick={() => {
                router.push(item.href);
                closeMobileMenu();
              }}
              className="w-full justify-start mb-1 relative"
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
              {showBadge ? (
                <Badge
                  variant="destructive"
                  className="h-5 w-5 p-0 text-xs flex items-center justify-center ml-auto"
                >
                  {totalUnreadCount}
                </Badge>
              ) : null}
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
                  onClick={() => {
                    router.push(item.href);
                    closeMobileMenu();
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

        <Button
          variant="ghost"
          onClick={toggleTheme}
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
          onClick={handleProfile}
          className="w-full justify-start"
        >
          <User className="w-5 h-5 mr-3" />
          Профиль
        </Button>

        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-destructive hover:text-destructive"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Выйти
        </Button>
      </div>
    </div>
  );
};