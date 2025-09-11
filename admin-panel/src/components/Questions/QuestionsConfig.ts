import { QuestionStatus, QuestionPriority } from '@/types';

export var getStatusVariant = (status: QuestionStatus): string =>
  status === QuestionStatus.OPEN ? 'secondary' :
  status === QuestionStatus.ASSIGNED ? 'default' :
  status === QuestionStatus.IN_PROGRESS ? 'default' :
  status === QuestionStatus.CLOSED ? 'default' :
  status === QuestionStatus.TRANSFERRED ? 'outline' : 'outline';

export var getPriorityVariant = (priority: QuestionPriority): string =>
  priority === QuestionPriority.LOW ? 'default' :
  priority === QuestionPriority.MEDIUM ? 'secondary' :
  priority === QuestionPriority.HIGH ? 'default' :
  priority === QuestionPriority.URGENT ? 'destructive' : 'outline';

export var getStatusLabel = (status: QuestionStatus): string =>
  status === QuestionStatus.OPEN ? 'Открыт' :
  status === QuestionStatus.ASSIGNED ? 'Назначен' :
  status === QuestionStatus.IN_PROGRESS ? 'В работе' :
  status === QuestionStatus.CLOSED ? 'Закрыт' :
  status === QuestionStatus.TRANSFERRED ? 'Передан' : status;

export var getPriorityLabel = (priority: QuestionPriority): string =>
  priority === QuestionPriority.LOW ? 'Низкий' :
  priority === QuestionPriority.MEDIUM ? 'Средний' :
  priority === QuestionPriority.HIGH ? 'Высокий' :
  priority === QuestionPriority.URGENT ? 'Срочный' : priority;

export var questionStatuses = [
  { value: QuestionStatus.OPEN, label: 'Открыт' },
  { value: QuestionStatus.ASSIGNED, label: 'Назначен' },
  { value: QuestionStatus.IN_PROGRESS, label: 'В работе' },
  { value: QuestionStatus.CLOSED, label: 'Закрыт' },
  { value: QuestionStatus.TRANSFERRED, label: 'Передан' }
];

export var questionPriorities = [
  { value: QuestionPriority.LOW, label: 'Низкий' },
  { value: QuestionPriority.MEDIUM, label: 'Средний' },
  { value: QuestionPriority.HIGH, label: 'Высокий' },
  { value: QuestionPriority.URGENT, label: 'Срочный' }
];