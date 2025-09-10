"use client";

import { ArrowLeft, ArrowRightLeft, Info, UserX } from "lucide-react";
import Button from "@/components/UI/Button";

interface ChatHeaderProps {
  selectedSender: {
    name: string;
    type: "operator" | "visitor";
    isOnline: boolean;
  } | null;
  isMobile: boolean;
  onBackClick: () => void;
  onTransferClick: () => void;
  onBlockClick: () => void;
  onInfoClick: () => void;
}

var ChatHeader = ({ 
  selectedSender, 
  isMobile, 
  onBackClick, 
  onTransferClick, 
  onBlockClick, 
  onInfoClick 
}: ChatHeaderProps) => (
  <div className="p-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBackClick}
            className="h-8 w-8 lg:hidden"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {selectedSender?.name}
          </h2>
          <p className="text-sm text-muted-foreground">
            {selectedSender?.isOnline ? "В сети" : "Не в сети"}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {selectedSender?.type === "visitor" && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={onTransferClick}
              className="h-8 w-8"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onBlockClick}
              className="h-8 w-8"
              title="Запросить блокировку пользователя"
            >
              <UserX className="w-4 h-4" />
            </Button>
          </>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onInfoClick}
          className="h-8 w-8"
        >
          <Info className="w-4 h-4" />
        </Button>
      </div>
    </div>
  </div>
);

export default ChatHeader;