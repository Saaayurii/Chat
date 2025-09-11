"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useTheme } from "next-themes";
import { useUI } from "@/contexts/UIContext";

export var useNavbarActions = () => {
  var router = useRouter();
  var { logout } = useAuthStore();
  var { setTheme, theme } = useTheme();
  var { actions } = useUI();

  var handleLogout = () => new Promise<void>((resolve) => {
    logout();
    router.push("/login");
    resolve();
  });

  var handleProfile = () => new Promise<void>((resolve) => {
    router.push("/profile");
    resolve();
  });

  var toggleTheme = () => new Promise<void>((resolve) => {
    setTheme(theme === "dark" ? "light" : "dark");
    resolve();
  });

  var closeMobileMenu = () => new Promise<void>((resolve) => {
    actions.closeMobileMenu();
    resolve();
  });

  var toggleMobileMenu = () => new Promise<void>((resolve) => {
    actions.toggleMobileMenu();
    resolve();
  });

  var navigateToLogo = (logoPath: string) => new Promise<void>((resolve) => {
    router.push(logoPath);
    resolve();
  });

  return {
    handleLogout,
    handleProfile,
    toggleTheme,
    closeMobileMenu,
    toggleMobileMenu,
    navigateToLogo,
    theme
  };
};