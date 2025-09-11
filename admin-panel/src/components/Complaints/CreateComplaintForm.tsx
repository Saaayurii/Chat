'use client';

import { 
  Input,
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
import { ComplaintType, ComplaintSeverity, CreateComplaintData } from '@/types';

interface CreateComplaintFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: CreateComplaintData;
  onFormDataChange: (data: CreateComplaintData) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}

export default ({ 
  open, 
  onOpenChange, 
  formData, 
  onFormDataChange, 
  onSubmit, 
  loading 
}: CreateComplaintFormProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Подать жалобу</DialogTitle>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4">
        <Select 
          value={formData.type} 
          onValueChange={(value) => onFormDataChange({ ...formData, type: value as ComplaintType })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Тип жалобы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ComplaintType.INAPPROPRIATE_BEHAVIOR}>Неподобающее поведение</SelectItem>
            <SelectItem value={ComplaintType.POOR_SERVICE}>Плохой сервис</SelectItem>
            <SelectItem value={ComplaintType.UNPROFESSIONAL_CONDUCT}>Непрофессиональное поведение</SelectItem>
            <SelectItem value={ComplaintType.DELAYED_RESPONSE}>Задержка ответа</SelectItem>
            <SelectItem value={ComplaintType.INCORRECT_INFORMATION}>Неверная информация</SelectItem>
            <SelectItem value={ComplaintType.OTHER}>Другое</SelectItem>
          </SelectContent>
        </Select>

        <textarea
          placeholder="Опишите суть жалобы..."
          value={formData.complaintText}
          onChange={(e) => onFormDataChange({ ...formData, complaintText: e.target.value })}
          className="w-full border border-input rounded-md px-3 py-2 h-32 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          required
        />

        <Input
          placeholder="ID оператора"
          value={formData.operatorId}
          onChange={(e) => onFormDataChange({ ...formData, operatorId: e.target.value })}
          required
        />
        
        <Select 
          value={formData.severity} 
          onValueChange={(value) => onFormDataChange({ ...formData, severity: value as ComplaintSeverity })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Серьезность" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ComplaintSeverity.LOW}>Низкая серьезность</SelectItem>
            <SelectItem value={ComplaintSeverity.MEDIUM}>Средняя серьезность</SelectItem>
            <SelectItem value={ComplaintSeverity.HIGH}>Высокая серьезность</SelectItem>
            <SelectItem value={ComplaintSeverity.CRITICAL}>Критическая серьезность</SelectItem>
          </SelectContent>
        </Select>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button type="submit" disabled={loading} variant="destructive">
            {loading ? 'Отправка...' : 'Отправить жалобу'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
);