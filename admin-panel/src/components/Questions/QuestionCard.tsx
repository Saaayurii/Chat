"use client";

import { Question, QuestionStatus, UserRole } from '@/types';
import { 
  Card, 
  CardContent, 
  Badge
} from '@/components/UI';
import Button from '../UI/Button';
import { getStatusVariant, getPriorityVariant } from './QuestionsConfig';

interface QuestionCardProps {
  question: Question;
  canManageQuestions: boolean;
  onAssignOperator: (question: Question) => Promise<void>;
  onCloseQuestion: (question: Question) => Promise<void>;
}

export var QuestionCard = ({
  question,
  canManageQuestions,
  onAssignOperator,
  onCloseQuestion,
}: QuestionCardProps) => {

  var handleAssignClick = () => new Promise<void>((resolve) => {
    onAssignOperator(question).then(() => resolve());
  });

  var handleCloseClick = () => new Promise<void>((resolve) => {
    onCloseQuestion(question).then(() => resolve());
  });

  var getOperatorName = () => new Promise<string>((resolve) => {
    question.operatorId ? 
      typeof question.operatorId === 'object' ? 
        resolve((question.operatorId as any).profile?.fullName || (question.operatorId as any).email) :
        resolve(question.operatorId) :
      resolve('');
  });

  var formatDate = (date: string | Date) => new Promise<string>((resolve) => {
    resolve(new Date(date).toLocaleString());
  });

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-foreground">{question.text}</h3>
            <p className="text-muted-foreground">Категория: {question.category}</p>
            {question.tags && question.tags.length > 0 && (
              <div className="flex gap-2 mt-2">
                {question.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Badge variant={getStatusVariant(question.status) as any}>
              {question.status}
            </Badge>
            <Badge variant={getPriorityVariant(question.priority) as any}>
              {question.priority}
            </Badge>
          </div>
        </div>

        <div className="text-sm text-muted-foreground mb-3">
          <p>Создан: {new Date(question.createdAt).toLocaleString()}</p>
          {question.assignedAt && (
            <p>Назначен: {new Date(question.assignedAt).toLocaleString()}</p>
          )}
          {question.closedAt && (
            <p>Закрыт: {new Date(question.closedAt).toLocaleString()}</p>
          )}
          {question.operatorId && (
            <p>Оператор: {
              typeof question.operatorId === 'object' 
                ? (question.operatorId as any).profile?.fullName || (question.operatorId as any).email
                : question.operatorId
            }</p>
          )}
          <p>Сообщений: {question.messagesCount}</p>
        </div>

        {canManageQuestions && question.status !== QuestionStatus.CLOSED && (
          <div className="flex gap-2">
            {question.status === QuestionStatus.OPEN && (
              <Button
                onClick={() => handleAssignClick()}
                size="sm"
              >
                Назначить оператора
              </Button>
            )}
            {question.status !== QuestionStatus.OPEN && (
              <Button
                onClick={() => handleCloseClick()}
                size="sm"
                variant="outline"
              >
                Закрыть вопрос
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};