"use client";

import { 
  Input, 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue
} from '@/components/UI';
import { QuestionStatus, QuestionPriority } from '@/types';
import { questionStatuses, questionPriorities } from './QuestionsConfig';

interface QuestionsFiltersProps {
  statusFilter: typeof QuestionStatus[keyof typeof QuestionStatus] | '';
  priorityFilter: typeof QuestionPriority[keyof typeof QuestionPriority] | '';
  categoryFilter: string;
  searchQuery: string;
  onStatusChange: (value: typeof QuestionStatus[keyof typeof QuestionStatus] | '') => Promise<void>;
  onPriorityChange: (value: typeof QuestionPriority[keyof typeof QuestionPriority] | '') => Promise<void>;
  onCategoryChange: (value: string) => Promise<void>;
  onSearchChange: (value: string) => Promise<void>;
}

export var QuestionsFilters = ({
  statusFilter,
  priorityFilter,
  categoryFilter,
  searchQuery,
  onStatusChange,
  onPriorityChange,
  onCategoryChange,
  onSearchChange,
}: QuestionsFiltersProps) => {

  var handleStatusChange = (value: string) => new Promise<void>((resolve) => {
    var status = value === 'all' ? '' : value as any;
    onStatusChange(status).then(() => resolve());
  });

  var handlePriorityChange = (value: string) => new Promise<void>((resolve) => {
    var priority = value === 'all' ? '' : value as any;
    onPriorityChange(priority).then(() => resolve());
  });

  var handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => new Promise<void>((resolve) => {
    onCategoryChange(e.target.value).then(() => resolve());
  });

  var handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => new Promise<void>((resolve) => {
    onSearchChange(e.target.value).then(() => resolve());
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
      <Select value={statusFilter || 'all'} onValueChange={(value) => handleStatusChange(value)}>
        <SelectTrigger>
          <SelectValue placeholder="Все статусы" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Все статусы</SelectItem>
          {questionStatuses.map((status) => (
            <SelectItem key={status.value} value={status.value}>
              {status.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={priorityFilter || 'all'} onValueChange={(value) => handlePriorityChange(value)}>
        <SelectTrigger>
          <SelectValue placeholder="Все приоритеты" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Все приоритеты</SelectItem>
          {questionPriorities.map((priority) => (
            <SelectItem key={priority.value} value={priority.value}>
              {priority.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        placeholder="Категория"
        value={categoryFilter}
        onChange={(e) => handleCategoryChange(e)}
        className="border-input"
      />

      <Input
        placeholder="Поиск..."
        value={searchQuery}
        onChange={(e) => handleSearchChange(e)}
        className="border-input"
      />
    </div>
  );
};