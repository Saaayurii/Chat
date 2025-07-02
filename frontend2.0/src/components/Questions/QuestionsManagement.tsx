'use client';

import { useState, useEffect } from 'react';
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

  const getStatusColor = (status: QuestionStatus) => {
    switch (status) {
      case QuestionStatus.OPEN: return 'bg-yellow-100 text-yellow-800';
      case QuestionStatus.ASSIGNED: return 'bg-blue-100 text-blue-800';
      case QuestionStatus.IN_PROGRESS: return 'bg-purple-100 text-purple-800';
      case QuestionStatus.CLOSED: return 'bg-green-100 text-green-800';
      case QuestionStatus.TRANSFERRED: return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: QuestionPriority) => {
    switch (priority) {
      case QuestionPriority.LOW: return 'bg-green-100 text-green-800';
      case QuestionPriority.MEDIUM: return 'bg-yellow-100 text-yellow-800';
      case QuestionPriority.HIGH: return 'bg-orange-100 text-orange-800';
      case QuestionPriority.URGENT: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && questions.length === 0) {
    return <div className="flex justify-center p-8">Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {user?.role === UserRole.VISITOR ? 'Мои вопросы' : 'Управление вопросами'}
        </h2>
        {canCreateQuestions && showCreateForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Задать вопрос
          </button>
        )}
      </div>

      {/* Filters */}
      {canManageQuestions && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as QuestionStatus | '')}
            className="border rounded px-3 py-2"
          >
            <option value="">Все статусы</option>
            <option value={QuestionStatus.OPEN}>Открыт</option>
            <option value={QuestionStatus.ASSIGNED}>Назначен</option>
            <option value={QuestionStatus.IN_PROGRESS}>В работе</option>
            <option value={QuestionStatus.CLOSED}>Закрыт</option>
            <option value={QuestionStatus.TRANSFERRED}>Передан</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as QuestionPriority | '')}
            className="border rounded px-3 py-2"
          >
            <option value="">Все приоритеты</option>
            <option value={QuestionPriority.LOW}>Низкий</option>
            <option value={QuestionPriority.MEDIUM}>Средний</option>
            <option value={QuestionPriority.HIGH}>Высокий</option>
            <option value={QuestionPriority.URGENT}>Срочный</option>
          </select>

          <input
            type="text"
            placeholder="Категория"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border rounded px-3 py-2"
          />

          <input
            type="text"
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((question) => (
          <div key={question._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{question.text}</h3>
                <p className="text-gray-600">Категория: {question.category}</p>
                {question.tags && question.tags.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {question.tags.map((tag, index) => (
                      <span key={index} className="bg-gray-200 px-2 py-1 rounded text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <span className={`px-2 py-1 rounded text-sm ${getStatusColor(question.status)}`}>
                  {question.status}
                </span>
                <span className={`px-2 py-1 rounded text-sm ${getPriorityColor(question.priority)}`}>
                  {question.priority}
                </span>
              </div>
            </div>

            <div className="text-sm text-gray-500 mb-3">
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
                  <button
                    onClick={() => {
                      setSelectedQuestion(question);
                      setShowAssignForm(true);
                    }}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                  >
                    Назначить оператора
                  </button>
                )}
                {question.status !== QuestionStatus.OPEN && (
                  <button
                    onClick={() => {
                      setSelectedQuestion(question);
                      setShowCloseForm(true);
                    }}
                    className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                  >
                    Закрыть вопрос
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {canManageQuestions && totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Назад
          </button>
          <span className="px-3 py-1">
            Страница {currentPage} из {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Вперед
          </button>
        </div>
      )}

      {/* Create Question Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Задать вопрос</h3>
            <form onSubmit={handleCreateQuestion} className="space-y-4">
              <textarea
                placeholder="Опишите ваш вопрос..."
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                className="w-full border rounded px-3 py-2 h-32"
                required
              />
              
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as QuestionPriority })}
                className="w-full border rounded px-3 py-2"
              >
                <option value={QuestionPriority.LOW}>Низкий приоритет</option>
                <option value={QuestionPriority.MEDIUM}>Средний приоритет</option>
                <option value={QuestionPriority.HIGH}>Высокий приоритет</option>
                <option value={QuestionPriority.URGENT}>Срочный</option>
              </select>

              <input
                type="text"
                placeholder="Категория"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? 'Отправка...' : 'Отправить'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Operator Form */}
      {showAssignForm && selectedQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Назначить оператора</h3>
            <form onSubmit={handleAssignOperator} className="space-y-4">
              <input
                type="text"
                placeholder="ID оператора"
                value={operatorId}
                onChange={(e) => setOperatorId(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? 'Назначение...' : 'Назначить'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAssignForm(false)}
                  className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Question Form */}
      {showCloseForm && selectedQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Закрыть вопрос</h3>
            <form onSubmit={handleCloseQuestion} className="space-y-4">
              <textarea
                placeholder="Комментарий к закрытию (необязательно)"
                value={closingComment}
                onChange={(e) => setClosingComment(e.target.value)}
                className="w-full border rounded px-3 py-2 h-24"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600 disabled:opacity-50"
                >
                  {loading ? 'Закрытие...' : 'Закрыть'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCloseForm(false)}
                  className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}