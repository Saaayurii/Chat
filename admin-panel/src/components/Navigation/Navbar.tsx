"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, Menu, X } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useUnreadMessages } from "@/contexts/UnreadMessagesContext";
import { useUI } from "@/contexts/UIContext";
import Button from "@/components/UI/Button";
import { useNavbarUtils } from "./NavbarUtils";
import { useNavbarActions } from "./NavbarActions";
import { NavbarDesktop } from "./NavbarDesktop";
import { NavbarMobile } from "./NavbarMobile";
import { NavbarUserDropdown } from "./NavbarUserDropdown";

export default function Navbar() {
  var { user } = useAuthStore();
  var { totalUnreadCount } = useUnreadMessages();
  var { state } = useUI();
  var [userInitials, setUserInitials] = useState("");
  var [mainItems, setMainItems] = useState([]);
  var [categories, setCategories] = useState([]);
  var [logoPath, setLogoPath] = useState("");

  var navbarUtils = useNavbarUtils(user);
  var {
    handleLogout,
    handleProfile,
    toggleTheme,
    closeMobileMenu,
    toggleMobileMenu,
    navigateToLogo,
    theme
  } = useNavbarActions();

  useEffect(() => {
    navbarUtils.getUserInitials().then(setUserInitials);
    navbarUtils.getNavigationCategories().then(({ mainItems, categories }) => {
      setMainItems(mainItems);
      setCategories(categories);
    });
    navbarUtils.getLogoClickPath().then(setLogoPath);
  }, [user]);

  var handleLogoClick = () => new Promise<void>((resolve) => {
    navigateToLogo(logoPath).then(() => resolve());
  });

  return !user ? null : (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span
                role="button"
                onClick={() => handleLogoClick()}
                className="text-lg font-semibold text-foreground cursor-pointer"
              >
                ChatSystem
              </span>
            </div>

            <NavbarDesktop
              mainItems={mainItems}
              categories={categories}
              totalUnreadCount={totalUnreadCount}
              user={user}
            />
          </div>

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleTheme()}
              className="hidden lg:flex"
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Переключить тему</span>
            </Button>

            <NavbarUserDropdown
              user={user}
              userInitials={userInitials}
              theme={theme}
              isMobileMenuOpen={state.isMobileMenuOpen}
              onCloseMobile={closeMobileMenu}
              onProfile={handleProfile}
              onToggleTheme={toggleTheme}
              onLogout={handleLogout}
            />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleMobileMenu()}
              className="md:hidden"
            >
              {state.isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <NavbarMobile
        isOpen={state.isMobileMenuOpen}
        mainItems={mainItems}
        categories={categories}
        totalUnreadCount={totalUnreadCount}
        user={user}
        theme={theme}
        userInitials={userInitials}
        onCloseMobile={closeMobileMenu}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
        onProfile={handleProfile}
      />
    </nav>
  );
}
