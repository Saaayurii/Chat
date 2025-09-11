"use client";

import { useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import Button from "@/components/UI/Button";
import { Badge } from "@/components/UI";
import { NavCategory, NavItem } from "./types";

interface NavbarDesktopProps {
  mainItems: NavItem[];
  categories: NavCategory[];
  user: any;
  totalUnreadCount: number;
}

export var NavbarDesktop = ({ mainItems, categories, user, totalUnreadCount }: NavbarDesktopProps) => {
  var router = useRouter();
  var pathname = usePathname();
  var [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  var dropdownRef = useRef<HTMLDivElement>(null);

  return (
    <div className="hidden md:ml-8 md:flex md:items-center md:space-x-1">
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
            onClick={() => router.push(item.href)}
            className="flex items-center space-x-2 relative"
          >
            <item.icon className="w-4 h-4" />
            <span>{item.name}</span>
            {showBadge ? (
              <Badge
                variant="destructive"
                className="h-5 w-5 p-0 text-xs flex items-center justify-center absolute -top-1 -right-1"
              >
                {totalUnreadCount}
              </Badge>
            ) : null}
          </Button>
        );
      })}

      <div ref={dropdownRef} className="flex space-x-1">
        {categories.map((category) => {
          var hasActiveItem = category.items.some(
            (item) => pathname === item.href
          );
          return (
            <div key={category.name} className="relative">
              <Button
                variant={hasActiveItem ? "default" : "ghost"}
                onClick={() =>
                  setDropdownOpen(
                    dropdownOpen === category.name ? null : category.name
                  )
                }
                className="flex items-center space-x-1"
              >
                <span>{category.name}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    dropdownOpen === category.name ? "rotate-180" : ""
                  }`}
                />
              </Button>

              {dropdownOpen === category.name ? (
                <div className="absolute top-full left-0 mt-1 w-48 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border border-border rounded-md shadow-lg z-50">
                  {category.items.map((item) => {
                    var isActive = pathname === item.href;
                    return (
                      <button
                        key={item.href}
                        onClick={() => {
                          router.push(item.href);
                          setDropdownOpen(null);
                        }}
                        className={`w-full flex items-center px-4 py-2 text-sm transition-colors first:rounded-t-md last:rounded-b-md hover:bg-accent ${
                          isActive ? "bg-accent" : ""
                        }`}
                      >
                        <item.icon className="w-4 h-4 mr-3" />
                        {item.name}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};