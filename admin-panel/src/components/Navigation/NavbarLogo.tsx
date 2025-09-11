"use client";

import { useRouter } from "next/navigation";
import { UserRole } from "@/types";

interface NavbarLogoProps {
  user: any;
}

export var NavbarLogo = ({ user }: NavbarLogoProps) => {
  var router = useRouter();

  var handleLogoClick = () => {
    !user ? 
      router.push("/login") :
      user.role === 'admin' ? 
        router.push("/admin/statistics") :
        user.role === 'operator' ? 
          router.push("/operator/statistics") :
          router.push("/login");
  };

  return (
    <div className="flex-shrink-0">
      <span
        role="button"
        onClick={handleLogoClick}
        className="text-lg font-semibold text-foreground cursor-pointer"
      >
        ChatSystem
      </span>
    </div>
  );
};