import { questionsAPI, usersAPI } from '@/core/api';
import { 
  Question, 
  QuestionStatus, 
  QuestionPriority, 
  CreateQuestionData,
  User,
  UserRole 
} from '@/types';

interface QuestionsActionsConfig {
  user: any;
  onSuccess?: () => Promise<void>;
  onError?: (error: string) => Promise<void>;
}

export var useQuestionsActions = ({ user, onSuccess, onError }: QuestionsActionsConfig) => {

  var loadQuestions = (params: any) => new Promise<{ questions: Question[]; total: number }>((resolve, reject) => {
    var queryParams = {
      page: params.currentPage,
      limit: 10,
      ...(params.statusFilter && { status: params.statusFilter }),
      ...(params.priorityFilter && { priority: params.priorityFilter }),
      ...(params.categoryFilter && { category: params.categoryFilter }),
      ...(params.searchQuery && { search: params.searchQuery }),
      sortBy: 'createdAt',
      sortOrder: 'desc' as const
    };

    user?.role === UserRole.VISITOR ? 
      questionsAPI.getMyQuestions()
        .then(response => resolve({ questions: response.data, total: response.data.length }))
        .catch(reject) :
      questionsAPI.getQuestions(queryParams)
        .then(response => resolve({ questions: response.data.questions, total: response.data.total }))
        .catch(reject);
  });

  var loadOperators = () => new Promise<User[]>((resolve, reject) => {
    usersAPI.getOperators()
      .then(response => resolve(response.data))
      .catch(reject);
  });

  var createQuestion = (formData: CreateQuestionData) => new Promise<void>((resolve, reject) => {
    user?.role !== UserRole.VISITOR ? reject(new Error('Недостаточно прав')) :
    questionsAPI.createQuestion(formData)
      .then(() => {
        onSuccess?.();
        resolve();
      })
      .catch(error => {
        var message = error.response?.data?.message || 'Ошибка при создании вопроса';
        onError?.(message);
        reject(error);
      });
  });

  var assignOperator = (questionId: string, operatorId: string) => new Promise<void>((resolve, reject) => {
    questionsAPI.assignOperator(questionId, { operatorId })
      .then(() => {
        onSuccess?.();
        resolve();
      })
      .catch(error => {
        var message = error.response?.data?.message || 'Ошибка при назначении оператора';
        onError?.(message);
        reject(error);
      });
  });

  var closeQuestion = (questionId: string, closingComment: string) => new Promise<void>((resolve, reject) => {
    questionsAPI.closeQuestion(questionId, { closingComment })
      .then(() => {
        onSuccess?.();
        resolve();
      })
      .catch(error => {
        var message = error.response?.data?.message || 'Ошибка при закрытии вопроса';
        onError?.(message);
        reject(error);
      });
  });

  var canManageQuestions = () => new Promise<boolean>((resolve) => {
    resolve(user?.role === UserRole.ADMIN || user?.role === UserRole.OPERATOR);
  });

  var canCreateQuestions = () => new Promise<boolean>((resolve) => {
    resolve(user?.role === UserRole.VISITOR);
  });

  return {
    loadQuestions,
    loadOperators,
    createQuestion,
    assignOperator,
    closeQuestion,
    canManageQuestions,
    canCreateQuestions
  };
};