"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Button from "@/components/UI/Button";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

var PaginationControls = ({ currentPage, totalPages, total, onPageChange }: PaginationControlsProps) => (
  <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
    <div className="text-sm text-muted-foreground">
      Показано {(currentPage - 1) * 10 + 1}-{Math.min(currentPage * 10, total)} из {total} коллег
    </div>
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="w-4 h-4" />
        Предыдущая
      </Button>

      <div className="flex items-center space-x-1">
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          var pageNumber = Math.max(1, currentPage - 2) + i;
          return pageNumber > totalPages ? null : (
            <Button
              key={pageNumber}
              variant={pageNumber === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(pageNumber)}
              className="w-8 h-8 p-0"
            >
              {pageNumber}
            </Button>
          );
        })}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Следующая
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  </div>
);

export default PaginationControls;