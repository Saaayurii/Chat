'use client';

import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/UI';
import Button from '../UI/Button';
import { ReviewComplaintData } from '@/types';

interface ReviewComplaintFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reviewData: ReviewComplaintData;
  onReviewDataChange: (data: ReviewComplaintData) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}

export default ({ 
  open, 
  onOpenChange, 
  reviewData, 
  onReviewDataChange, 
  onSubmit, 
  loading 
}: ReviewComplaintFormProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Рассмотреть жалобу</DialogTitle>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4">
        <Select 
          value={reviewData.decision} 
          onValueChange={(value) => onReviewDataChange({ ...reviewData, decision: value as 'resolved' | 'dismissed' })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Решение" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="resolved">Принять жалобу</SelectItem>
            <SelectItem value="dismissed">Отклонить жалобу</SelectItem>
          </SelectContent>
        </Select>

        <textarea
          placeholder="Ответ администратора..."
          value={reviewData.adminResponse}
          onChange={(e) => onReviewDataChange({ ...reviewData, adminResponse: e.target.value })}
          className="w-full border border-input rounded-md px-3 py-2 h-24 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          required
        />

        <textarea
          placeholder="Заметки по решению (необязательно)"
          value={reviewData.resolutionNotes}
          onChange={(e) => onReviewDataChange({ ...reviewData, resolutionNotes: e.target.value })}
          className="w-full border border-input rounded-md px-3 py-2 h-20 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        />

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={reviewData.warnOperator}
              onChange={(e) => onReviewDataChange({ ...reviewData, warnOperator: e.target.checked })}
              className="rounded border-input"
            />
            <span className="text-foreground">Предупредить оператора</span>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={reviewData.suspendOperator}
              onChange={(e) => onReviewDataChange({ ...reviewData, suspendOperator: e.target.checked })}
              className="rounded border-input"
            />
            <span className="text-foreground">Заблокировать оператора</span>
          </label>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Обработка...' : 'Принять решение'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
);