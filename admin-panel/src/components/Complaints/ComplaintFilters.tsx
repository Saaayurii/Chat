'use client';

import { 
  Input,
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/UI';
import { ComplaintStatus, ComplaintType, ComplaintSeverity } from '@/types';

interface ComplaintFiltersProps {
  statusFilter: typeof ComplaintStatus[keyof typeof ComplaintStatus] | '';
  typeFilter: typeof ComplaintType[keyof typeof ComplaintType] | '';
  severityFilter: typeof ComplaintSeverity[keyof typeof ComplaintSeverity] | '';
  searchQuery: string;
  onStatusChange: (value: typeof ComplaintStatus[keyof typeof ComplaintStatus] | '') => void;
  onTypeChange: (value: typeof ComplaintType[keyof typeof ComplaintType] | '') => void;
  onSeverityChange: (value: typeof ComplaintSeverity[keyof typeof ComplaintSeverity] | '') => void;
  onSearchChange: (value: string) => void;
}

export default ({ 
  statusFilter, 
  typeFilter, 
  severityFilter, 
  searchQuery,
  onStatusChange,
  onTypeChange,
  onSeverityChange,
  onSearchChange
}: ComplaintFiltersProps) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
    <Select 
      value={statusFilter || 'all'} 
      onValueChange={(value) => onStatusChange(value === 'all' ? '' : value as any)}
    >
      <SelectTrigger>
        <SelectValue placeholder="Все статусы" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Все статусы</SelectItem>
        <SelectItem value={ComplaintStatus.PENDING}>Ожидает</SelectItem>
        <SelectItem value={ComplaintStatus.UNDER_REVIEW}>На рассмотрении</SelectItem>
        <SelectItem value={ComplaintStatus.RESOLVED}>Решена</SelectItem>
        <SelectItem value={ComplaintStatus.DISMISSED}>Отклонена</SelectItem>
      </SelectContent>
    </Select>

    <Select 
      value={typeFilter || 'all'} 
      onValueChange={(value) => onTypeChange(value === 'all' ? '' : value as any)}
    >
      <SelectTrigger>
        <SelectValue placeholder="Все типы" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Все типы</SelectItem>
        <SelectItem value={ComplaintType.INAPPROPRIATE_BEHAVIOR}>Неподобающее поведение</SelectItem>
        <SelectItem value={ComplaintType.POOR_SERVICE}>Плохой сервис</SelectItem>
        <SelectItem value={ComplaintType.UNPROFESSIONAL_CONDUCT}>Непрофессиональное поведение</SelectItem>
        <SelectItem value={ComplaintType.DELAYED_RESPONSE}>Задержка ответа</SelectItem>
        <SelectItem value={ComplaintType.INCORRECT_INFORMATION}>Неверная информация</SelectItem>
        <SelectItem value={ComplaintType.OTHER}>Другое</SelectItem>
      </SelectContent>
    </Select>

    <Select 
      value={severityFilter || 'all'} 
      onValueChange={(value) => onSeverityChange(value === 'all' ? '' : value as any)}
    >
      <SelectTrigger>
        <SelectValue placeholder="Все уровни" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Все уровни</SelectItem>
        <SelectItem value={ComplaintSeverity.LOW}>Низкий</SelectItem>
        <SelectItem value={ComplaintSeverity.MEDIUM}>Средний</SelectItem>
        <SelectItem value={ComplaintSeverity.HIGH}>Высокий</SelectItem>
        <SelectItem value={ComplaintSeverity.CRITICAL}>Критический</SelectItem>
      </SelectContent>
    </Select>

    <Input
      placeholder="Поиск..."
      value={searchQuery}
      onChange={(e) => onSearchChange(e.target.value)}
      className="border-input"
    />
  </div>
);