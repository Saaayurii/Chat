"use client";

import Button from '../UI/Button';

interface QuestionsPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => Promise<void>;
}

export var QuestionsPagination = ({ currentPage, totalPages, onPageChange }: QuestionsPaginationProps) => {

  var handlePrevious = () => new Promise<void>((resolve) => {
    var newPage = Math.max(1, currentPage - 1);
    onPageChange(newPage).then(() => resolve());
  });

  var handleNext = () => new Promise<void>((resolve) => {
    var newPage = Math.min(totalPages, currentPage + 1);
    onPageChange(newPage).then(() => resolve());
  });

  return totalPages > 1 ? (
    <div className="flex justify-center gap-2">
      <Button
        onClick={() => handlePrevious()}
        disabled={currentPage === 1}
        variant="outline"
      >
        Назад
      </Button>
      <span className="px-3 py-2 text-sm text-muted-foreground self-center">
        Страница {currentPage} из {totalPages}
      </span>
      <Button
        onClick={() => handleNext()}
        disabled={currentPage === totalPages}
        variant="outline"
      >
        Вперед
      </Button>
    </div>
  ) : null;
};