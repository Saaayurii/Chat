"use client";

import { Menu, Search } from "lucide-react";
import Button from "@/components/UI/Button";

interface EmptyChatProps {
  isMobile: boolean;
  onMenuClick: () => void;
  isMenuOpen: boolean;
}

var EmptyChat = ({ isMobile, onMenuClick, isMenuOpen }: EmptyChatProps) => (
  <div className="flex-1 flex items-center justify-center bg-background relative">
    {isMobile && !isMenuOpen && (
      <div className="absolute top-4 left-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="h-10 w-10"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>
    )}
    <div className="text-center">
      <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
        <Search className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">Выберите чат</h3>
      {isMobile && (
        <p className="text-sm text-muted-foreground">
          Нажмите на меню, чтобы выбрать чат
        </p>
      )}
    </div>
  </div>
);

export default EmptyChat;
