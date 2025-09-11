'use client';

import Button from '../UI/Button';

interface ComplaintsPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default ({ currentPage, totalPages, onPageChange }: ComplaintsPaginationProps) => 
  totalPages > 1 ? (
    <div className="flex justify-center gap-2">
      <Button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        variant="outline"
      >
        Назад
      </Button>
      <span className="px-3 py-2 text-sm text-muted-foreground self-center">
        Страница {currentPage} из {totalPages}
      </span>
      <Button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        variant="outline"
      >
        Вперед
      </Button>
    </div>
  ) : null;