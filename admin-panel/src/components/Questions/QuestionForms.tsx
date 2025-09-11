"use client";

import { useState } from 'react';
import { 
  Question, 
  QuestionPriority, 
  CreateQuestionData,
  User 
} from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge
} from '@/components/UI';
import Button from '../UI/Button';
import { getPriorityVariant, questionPriorities } from './QuestionsConfig';

interface CreateQuestionFormProps {
  open: boolean;
  loading: boolean;
  onClose: () => Promise<void>;
  onSubmit: (data: CreateQuestionData) => Promise<void>;
}

export var CreateQuestionForm = ({ open, loading, onClose, onSubmit }: CreateQuestionFormProps) => {
  var [formData, setFormData] = useState<CreateQuestionData>({
    text: '',
    priority: QuestionPriority.MEDIUM,
    category: '',
    tags: []
  });

  var handleSubmit = (e: React.FormEvent) => new Promise<void>((resolve) => {
    e.preventDefault();
    onSubmit(formData).then(() => {
      setFormData({
        text: '',
        priority: QuestionPriority.MEDIUM,
        category: '',
        tags: []
      });
      resolve();
    });
  });

  var handleClose = () => new Promise<void>((resolve) => {
    onClose().then(() => resolve());
  });

  return (
    <Dialog open={open} onOpenChange={() => handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Задать вопрос</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
          <textarea
            placeholder="Опишите ваш вопрос..."
            value={formData.text}
            onChange={(e) => setFormData({ ...formData, text: e.target.value })}
            className="w-full border border-input rounded-md px-3 py-2 h-32 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            required
          />
          
          <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as QuestionPriority })}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите приоритет" />
            </SelectTrigger>
            <SelectContent>
              {questionPriorities.map((priority) => (
                <SelectItem key={priority.value} value={priority.value}>
                  {priority.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Категория"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose()}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Отправка...' : 'Отправить'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

interface AssignOperatorFormProps {
  open: boolean;
  loading: boolean;
  operatorsLoading: boolean;
  question: Question | null;
  operators: User[];
  onClose: () => Promise<void>;
  onSubmit: (operatorId: string) => Promise<void>;
}

export var AssignOperatorForm = ({ 
  open, 
  loading, 
  operatorsLoading, 
  question, 
  operators, 
  onClose, 
  onSubmit 
}: AssignOperatorFormProps) => {
  var [operatorId, setOperatorId] = useState('');

  var handleSubmit = (e: React.FormEvent) => new Promise<void>((resolve) => {
    e.preventDefault();
    operatorId ? onSubmit(operatorId).then(() => {
      setOperatorId('');
      resolve();
    }) : resolve();
  });

  var handleClose = () => new Promise<void>((resolve) => {
    setOperatorId('');
    onClose().then(() => resolve());
  });

  return (
    <Dialog open={open} onOpenChange={() => handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Назначить оператора</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
          {question && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Вопрос:</p>
              <p className="font-medium">{question.text}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant={getPriorityVariant(question.priority)}>
                  {question.priority}
                </Badge>
                <Badge variant="outline">
                  {question.category}
                </Badge>
              </div>
            </div>
          )}
          
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Выберите оператора
            </label>
            {operatorsLoading ? (
              <div className="text-center text-muted-foreground py-4">
                Загрузка операторов...
              </div>
            ) : operators.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                Нет доступных операторов
              </div>
            ) : (
              <Select value={operatorId} onValueChange={setOperatorId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите оператора" />
                </SelectTrigger>
                <SelectContent>
                  {operators.map((operator) => (
                    <SelectItem key={operator._id} value={operator._id}>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {operator.profile?.fullName || operator.profile?.username || operator.email}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {operator.email}
                          </span>
                          {operator.operatorStats && (
                            <span className="text-xs text-muted-foreground">
                              Рейтинг: {operator.operatorStats.averageRating?.toFixed(1) || 'Нет'} | 
                              Вопросов: {operator.operatorStats.totalQuestions || 0}
                            </span>
                          )}
                        </div>
                        {operator.profile?.isOnline !== undefined && (
                          <Badge 
                            variant={operator.profile?.isOnline ? 'default' : 'secondary'}
                            className="ml-auto"
                          >
                            {operator.profile?.isOnline ? 'Доступен' : 'Не в сети'}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose()}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading || !operatorId || operatorsLoading}>
              {loading ? 'Назначение...' : 'Назначить'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

interface CloseQuestionFormProps {
  open: boolean;
  loading: boolean;
  onClose: () => Promise<void>;
  onSubmit: (comment: string) => Promise<void>;
}

export var CloseQuestionForm = ({ open, loading, onClose, onSubmit }: CloseQuestionFormProps) => {
  var [closingComment, setClosingComment] = useState('');

  var handleSubmit = (e: React.FormEvent) => new Promise<void>((resolve) => {
    e.preventDefault();
    onSubmit(closingComment).then(() => {
      setClosingComment('');
      resolve();
    });
  });

  var handleClose = () => new Promise<void>((resolve) => {
    setClosingComment('');
    onClose().then(() => resolve());
  });

  return (
    <Dialog open={open} onOpenChange={() => handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Закрыть вопрос</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
          <textarea
            placeholder="Комментарий к закрытию (необязательно)"
            value={closingComment}
            onChange={(e) => setClosingComment(e.target.value)}
            className="w-full border border-input rounded-md px-3 py-2 h-24 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose()}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Закрытие...' : 'Закрыть'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};