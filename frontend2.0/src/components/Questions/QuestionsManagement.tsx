'use client';

import { useState, useEffect, Suspense } from 'react';
import { questionsAPI } from '@/core/api';
import { 
  Question, 
  QuestionStatus, 
  QuestionPriority, 
  CreateQuestionData,
  AssignOperatorData,
  CloseQuestionData,
  UserRole 
} from '@/types';
import { useAuthStore } from '@/store/authStore';
import { 
  Input, 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Alert,
  Badge
} from '@/components/UI';
import Button from '../UI/Button';

interface QuestionsManagementProps {
  userRole?: UserRole;
  showCreateForm?: boolean;
}

export default function QuestionsManagement({ 
  userRole, 
  showCreateForm = true 
}: QuestionsManagementProps) {
  const { user } = useAuthStore();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<QuestionStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<QuestionPriority | ''>('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CreateQuestionData>({
    text: '',
    priority: QuestionPriority.MEDIUM,
    category: '',
    tags: []
  });
  
  // Selected question for actions
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [showCloseForm, setShowCloseForm] = useState(false);
  const [operatorId, setOperatorId] = useState('');
  const [closingComment, setClosingComment] = useState('');

  const canManageQuestions = user?.role === UserRole.ADMIN || user?.role === UserRole.OPERATOR;
  const canCreateQuestions = user?.role === UserRole.VISITOR;

  useEffect(() => {
    loadQuestions();
  }, [currentPage, statusFilter, priorityFilter, categoryFilter, searchQuery]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage,
        limit: 10,
        ...(statusFilter && { status: statusFilter }),
        ...(priorityFilter && { priority: priorityFilter }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(searchQuery && { search: searchQuery }),
        sortBy: 'createdAt',
        sortOrder: 'desc' as const
      };

      let response;
      if (user?.role === UserRole.VISITOR) {
        response = await questionsAPI.getMyQuestions();
        setQuestions(response.data);
      } else {
        response = await questionsAPI.getQuestions(params);
        setQuestions(response.data.questions);
        setTotalPages(Math.ceil(response.data.total / 10));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при загрузке вопросов');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateQuestions) return;

    try {
      setLoading(true);
      await questionsAPI.createQuestion(formData);
      setShowForm(false);
      setFormData({
        text: '',
        priority: QuestionPriority.MEDIUM,
        category: '',
        tags: []
      });
      loadQuestions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при создании вопроса');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestion || !canManageQuestions) return;

    try {
      setLoading(true);
      await questionsAPI.assignOperator(selectedQuestion._id, { operatorId });
      setShowAssignForm(false);
      setSelectedQuestion(null);
      setOperatorId('');
      loadQuestions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при назначении оператора');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestion || !canManageQuestions) return;

    try {
      setLoading(true);
      await questionsAPI.closeQuestion(selectedQuestion._id, { closingComment });
      setShowCloseForm(false);
      setSelectedQuestion(null);
      setClosingComment('');
      loadQuestions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при закрытии вопроса');
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status: QuestionStatus) => {
    switch (status) {
      case QuestionStatus.OPEN: return 'secondary';
      case QuestionStatus.ASSIGNED: return 'default';
      case QuestionStatus.IN_PROGRESS: return 'default';
      case QuestionStatus.CLOSED: return 'default';
      case QuestionStatus.TRANSFERRED: return 'outline';
      default: return 'outline';
    }
  };

  const getPriorityVariant = (priority: QuestionPriority) => {
    switch (priority) {
      case QuestionPriority.LOW: return 'default';
      case QuestionPriority.MEDIUM: return 'secondary';
      case QuestionPriority.HIGH: return 'default';
      case QuestionPriority.URGENT: return 'destructive';
      default: return 'outline';
    }
  };

  if (loading && questions.length === 0) {
    return (
      <div className="flex justify-center p-8">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="flex justify-center p-8"><div className="text-muted-foreground">Загрузка...</div></div>}>
      <div className="space-y-6">
        {error && (
          <Alert variant="destructive">
            {error}
          </Alert>
        )}

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold text-foreground">
                {user?.role === UserRole.VISITOR ? 'Мои вопросы' : 'Управление вопросами'}
              </CardTitle>
              {canCreateQuestions && showCreateForm && (
                <Button onClick={() => setShowForm(true)}>
                  Задать вопрос
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Filters */}
            {canManageQuestions && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                <Select value={statusFilter || 'all'} onValueChange={(value) => setStatusFilter(value === 'all' ? '' : value as QuestionStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Все статусы" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    <SelectItem value={QuestionStatus.OPEN}>Открыт</SelectItem>
                    <SelectItem value={QuestionStatus.ASSIGNED}>Назначен</SelectItem>
                    <SelectItem value={QuestionStatus.IN_PROGRESS}>В работе</SelectItem>
                    <SelectItem value={QuestionStatus.CLOSED}>Закрыт</SelectItem>
                    <SelectItem value={QuestionStatus.TRANSFERRED}>Передан</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={priorityFilter || 'all'} onValueChange={(value) => setPriorityFilter(value === 'all' ? '' : value as QuestionPriority)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Все приоритеты" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все приоритеты</SelectItem>
                    <SelectItem value={QuestionPriority.LOW}>Низкий</SelectItem>
                    <SelectItem value={QuestionPriority.MEDIUM}>Средний</SelectItem>
                    <SelectItem value={QuestionPriority.HIGH}>Высокий</SelectItem>
                    <SelectItem value={QuestionPriority.URGENT}>Срочный</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Категория"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="border-input"
                />

                <Input
                  placeholder="Поиск..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-input"
                />
              </div>
            )}

            {/* Questions List */}
            <div className="space-y-4">
              {questions.map((question) => (
                <Card key={question._id} className="hover:shadow-md transition-shadow">
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
                        <Badge variant={getStatusVariant(question.status)}>
                          {question.status}
                        </Badge>
                        <Badge variant={getPriorityVariant(question.priority)}>
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
                      <p>Сообщений: {question.messagesCount}</p>
                    </div>

                    {canManageQuestions && question.status !== QuestionStatus.CLOSED && (
                      <div className="flex gap-2">
                        {question.status === QuestionStatus.OPEN && (
                          <Button
                            onClick={() => {
                              setSelectedQuestion(question);
                              setShowAssignForm(true);
                            }}
                            size="sm"
                          >
                            Назначить оператора
                          </Button>
                        )}
                        {question.status !== QuestionStatus.OPEN && (
                          <Button
                            onClick={() => {
                              setSelectedQuestion(question);
                              setShowCloseForm(true);
                            }}
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
              ))}
            </div>

            {/* Pagination */}
            {canManageQuestions && totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <Button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                >
                  Назад
                </Button>
                <span className="px-3 py-2 text-sm text-muted-foreground self-center">
                  Страница {currentPage} из {totalPages}
                </span>
                <Button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                >
                  Вперед
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Question Form */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Задать вопрос</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateQuestion} className="space-y-4">
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
                  <SelectItem value={QuestionPriority.LOW}>Низкий приоритет</SelectItem>
                  <SelectItem value={QuestionPriority.MEDIUM}>Средний приоритет</SelectItem>
                  <SelectItem value={QuestionPriority.HIGH}>Высокий приоритет</SelectItem>
                  <SelectItem value={QuestionPriority.URGENT}>Срочный</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Категория"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Отмена
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Отправка...' : 'Отправить'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Assign Operator Form */}
        <Dialog open={showAssignForm} onOpenChange={setShowAssignForm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Назначить оператора</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAssignOperator} className="space-y-4">
              <Input
                placeholder="ID оператора"
                value={operatorId}
                onChange={(e) => setOperatorId(e.target.value)}
                required
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAssignForm(false)}>
                  Отмена
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Назначение...' : 'Назначить'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Close Question Form */}
        <Dialog open={showCloseForm} onOpenChange={setShowCloseForm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Закрыть вопрос</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCloseQuestion} className="space-y-4">
              <textarea
                placeholder="Комментарий к закрытию (необязательно)"
                value={closingComment}
                onChange={(e) => setClosingComment(e.target.value)}
                className="w-full border border-input rounded-md px-3 py-2 h-24 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCloseForm(false)}>
                  Отмена
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Закрытие...' : 'Закрыть'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Suspense>
  );
}