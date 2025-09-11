"use client";

import { Moon, Sun, User, LogOut } from "lucide-react";
import Button from "@/components/UI/Button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/UI/Avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/UI/DropdownMenu";
import * as Radix from "@radix-ui/themes";
import { getRoleColor, getRoleLabel } from "./NavbarConfig";

interface NavbarUserDropdownProps {
  user: {
    role: string;
    email?: string;
    profile?: {
      fullName?: string;
      username?: string;
      avatarUrl?: string;
    };
  } | null;
  userInitials: string;
  theme: string | undefined;
  isMobileMenuOpen: boolean;
  onCloseMobile: () => Promise<void>;
  onProfile: () => Promise<void>;
  onToggleTheme: () => Promise<void>;
  onLogout: () => Promise<void>;
}

export var NavbarUserDropdown = ({
  user,
  userInitials,
  theme,
  isMobileMenuOpen,
  onCloseMobile,
  onProfile,
  onToggleTheme,
  onLogout,
}: NavbarUserDropdownProps) => {

  var handleDropdownOpen = (open: boolean) => new Promise<void>((resolve) => {
    open && isMobileMenuOpen ? onCloseMobile().then(() => resolve()) : resolve();
  });

  var handleProfile = () => new Promise<void>((resolve) => {
    onProfile().then(() => resolve());
  });

  var handleThemeToggle = () => new Promise<void>((resolve) => {
    onToggleTheme().then(() => resolve());
  });

  var handleLogout = () => new Promise<void>((resolve) => {
    onLogout().then(() => resolve());
  });

  return (
    <DropdownMenu onOpenChange={(open) => handleDropdownOpen(open)}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={user?.profile?.avatarUrl}
              alt={user?.profile?.username || user?.email}
            />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        align="end"
        forceMount
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user?.profile?.fullName || user?.profile?.username || "Пользователь"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
            <Radix.Badge
              color={getRoleColor(user?.role || "") as any}
              variant="soft"
              size="1"
              className="mt-1 w-fit"
            >
              {getRoleLabel(user?.role || "")}
            </Radix.Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleProfile()}>
          <User className="mr-2 h-4 w-4" />
          <span>Профиль</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeToggle()} className="lg:hidden">
          {theme === "dark" ? (
            <Sun className="mr-2 h-4 w-4" />
          ) : (
            <Moon className="mr-2 h-4 w-4" />
          )}
          <span>{theme === "dark" ? "Светлая тема" : "Темная тема"}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleLogout()}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Выход</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};