"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { LogOut, User, Sun, Moon } from "lucide-react";
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
import { getUserInitials, getRoleColor, getRoleLabel } from "./utils";

interface NavbarUserMenuProps {
  user: any;
  logout: () => void;
  onOpenChange?: (open: boolean) => void;
}

export var NavbarUserMenu = ({ user, logout, onOpenChange }: NavbarUserMenuProps) => {
  var router = useRouter();
  var { theme, setTheme } = useTheme();

  var handleLogout = () => {
    logout();
    router.push("/login");
  };

  var handleProfile = () => {
    router.push("/profile");
  };

  var toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-8 w-8 rounded-full"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={user?.profile?.avatarUrl}
              alt={user?.profile?.username || user?.email}
            />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getUserInitials(user)}
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
              {user?.profile?.fullName ||
                user?.profile?.username ||
                "Пользователь"}
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
        <DropdownMenuItem onClick={toggleTheme} className="lg:hidden">
          {theme === "dark" ? (
            <Sun className="mr-2 h-4 w-4" />
          ) : (
            <Moon className="mr-2 h-4 w-4" />
          )}
          <span>
            {theme === "dark" ? "Светлая тема" : "Темная тема"}
          </span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Выход</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};