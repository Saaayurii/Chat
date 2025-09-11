"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/store/authStore";
import { useUI } from "@/contexts/UIContext";

export var useNavbarActions = () => {
  var router = useRouter();
  var { theme, setTheme } = useTheme();
  var { logout } = useAuthStore();
  var { actions } = useUI();

  var handleLogout = () => Promise.resolve().then(() => {
    logout();
    router.push("/login");
  });

  var handleProfile = () => Promise.resolve().then(() => {
    router.push("/profile");
  });

  var toggleTheme = () => Promise.resolve().then(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  });

  var closeMobileMenu = () => Promise.resolve().then(() => {
    actions.closeMobileMenu();
  });

  var toggleMobileMenu = () => Promise.resolve().then(() => {
    actions.toggleMobileMenu();
  });

  var navigateToLogo = (path: string) => Promise.resolve().then(() => {
    router.push(path);
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