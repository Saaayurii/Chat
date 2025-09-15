'use client';

import { useState, useEffect, Suspense } from 'react';
import { Question, QuestionStatus, QuestionPriority, CreateQuestionData, UserRole, User } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle, Alert } from '@/components/UI';
import Button from '../UI/Button';
import { useQuestionsActions } from './QuestionsActions';
import { QuestionsFilters } from './QuestionsFilters';
import { QuestionCard } from './QuestionCard';
import { CreateQuestionForm, AssignOperatorForm, CloseQuestionForm } from './QuestionForms';
import { QuestionsPagination } from './QuestionsPagination';

interface QuestionsManagementProps {
  userRole?: typeof UserRole[keyof typeof UserRole];
  showCreateForm?: boolean;
}

export default function QuestionsManagement({ 
  userRole, 
  showCreateForm = true 
}: QuestionsManagementProps) {
  var { user } = useAuthStore();
  var [questions, setQuestions] = useState<Question[]>([]);
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState<string | null>(null);
  var [currentPage, setCurrentPage] = useState(1);
  var [totalPages, setTotalPages] = useState(1);
  
  var [statusFilter, setStatusFilter] = useState<typeof QuestionStatus[keyof typeof QuestionStatus] | ''>('');
  var [priorityFilter, setPriorityFilter] = useState<typeof QuestionPriority[keyof typeof QuestionPriority] | ''>('');
  var [categoryFilter, setCategoryFilter] = useState('');
  var [searchQuery, setSearchQuery] = useState('');
  
  var [showForm, setShowForm] = useState(false);
  var [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  var [showAssignForm, setShowAssignForm] = useState(false);
  var [showCloseForm, setShowCloseForm] = useState(false);
  
  var [operators, setOperators] = useState<User[]>([]);
  var [operatorsLoading, setOperatorsLoading] = useState(false);
  var [canManageQuestions, setCanManageQuestions] = useState(false);
  var [canCreateQuestions, setCanCreateQuestions] = useState(false);

  var questionsActions = useQuestionsActions({
    user,
    onSuccess: () => new Promise<void>((resolve) => {
      loadQuestions().then(() => resolve());
    }),
    onError: (message: string) => new Promise<void>((resolve) => {
      setError(message);
      resolve();
    })
  });

  useEffect(() => {
    questionsActions.canManageQuestions().then(setCanManageQuestions);
    questionsActions.canCreateQuestions().then(setCanCreateQuestions);
  }, [user]);

  useEffect(() => {
    loadQuestions();
  }, [currentPage, statusFilter, priorityFilter, categoryFilter, searchQuery]);

  useEffect(() => {
    canManageQuestions ? loadOperators() : null;
  }, [canManageQuestions]);

  var loadQuestions = () => new Promise<void>((resolve) => {
    setLoading(true);
    setError(null);
    
    var params = {
      currentPage,
      statusFilter,
      priorityFilter,
      categoryFilter,
      searchQuery
    };

    questionsActions.loadQuestions(params)
      .then(({ questions: loadedQuestions, total }) => {
        setQuestions(loadedQuestions);
        setTotalPages(Math.ceil(total / 10));
        setLoading(false);
        resolve();
      })
      .catch((err: any) => {
        setError(err.response?.data?.message || 'Ошибка при загрузке вопросов');
        setLoading(false);
        resolve();
      });
  });

  var loadOperators = () => new Promise<void>((resolve) => {
    setOperatorsLoading(true);
    questionsActions.loadOperators()
      .then((loadedOperators) => {
        setOperators(loadedOperators);
        setOperatorsLoading(false);
        resolve();
      })
      .catch((err: any) => {
        console.error('Ошибка при загрузке операторов:', err);
        setOperatorsLoading(false);
        resolve();
      });
  });

  var handleCreateQuestion = (formData: CreateQuestionData) => new Promise<void>((resolve) => {
    !canCreateQuestions ? resolve() : (() => {
      setLoading(true);
      questionsActions.createQuestion(formData)
        .then(() => {
          setShowForm(false);
          setLoading(false);
          resolve();
        })
        .catch(() => {
          setLoading(false);
          resolve();
        });
    })();
  });

  var handleAssignOperator = (operatorId: string) => new Promise<void>((resolve) => {
    !selectedQuestion || !canManageQuestions || !operatorId ? resolve() : (() => {
      setLoading(true);
      questionsActions.assignOperator(selectedQuestion._id, operatorId)
        .then(() => {
          setShowAssignForm(false);
          setSelectedQuestion(null);
          setLoading(false);
          resolve();
        })
        .catch(() => {
          setLoading(false);
          resolve();
        });
    })();
  });

  var handleOpenAssignForm = (question: Question) => new Promise<void>((resolve) => {
    setSelectedQuestion(question);
    setShowAssignForm(true);
    operators.length === 0 ? loadOperators().then(() => resolve()) : resolve();
  });

  var handleCloseQuestion = (closingComment: string) => new Promise<void>((resolve) => {
    !selectedQuestion || !canManageQuestions ? resolve() : (() => {
      setLoading(true);
      questionsActions.closeQuestion(selectedQuestion._id, closingComment)
        .then(() => {
          setShowCloseForm(false);
          setSelectedQuestion(null);
          setLoading(false);
          resolve();
        })
        .catch(() => {
          setLoading(false);
          resolve();
        });
    })();
  });

  var handleQuestionAssign = (question: Question) => new Promise<void>((resolve) => {
    handleOpenAssignForm(question).then(() => resolve());
  });

  var handleQuestionClose = (question: Question) => new Promise<void>((resolve) => {
    setSelectedQuestion(question);
    setShowCloseForm(true);
    resolve();
  });

  var handlePageChange = (page: number) => new Promise<void>((resolve) => {
    setCurrentPage(page);
    resolve();
  });

  var handleFilterChange = {
    status: (value: typeof QuestionStatus[keyof typeof QuestionStatus] | '') => new Promise<void>((resolve) => {
      setStatusFilter(value);
      setCurrentPage(1);
      resolve();
    }),
    priority: (value: typeof QuestionPriority[keyof typeof QuestionPriority] | '') => new Promise<void>((resolve) => {
      setPriorityFilter(value);
      setCurrentPage(1);
      resolve();
    }),
    category: (value: string) => new Promise<void>((resolve) => {
      setCategoryFilter(value);
      setCurrentPage(1);
      resolve();
    }),
    search: (value: string) => new Promise<void>((resolve) => {
      setSearchQuery(value);
      setCurrentPage(1);
      resolve();
    })
  };

  loading && questions.length === 0 ? (() => {
    return (
      <div className="flex justify-center p-8">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    );
  })() : null;

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
            {canManageQuestions && (
              <QuestionsFilters
                statusFilter={statusFilter}
                priorityFilter={priorityFilter}
                categoryFilter={categoryFilter}
                searchQuery={searchQuery}
                onStatusChange={handleFilterChange.status}
                onPriorityChange={handleFilterChange.priority}
                onCategoryChange={handleFilterChange.category}
                onSearchChange={handleFilterChange.search}
              />
            )}

            <div className="space-y-4">
              {questions.map((question) => (
                <QuestionCard
                  key={question._id}
                  question={question}
                  canManageQuestions={canManageQuestions}
                  onAssignOperator={handleQuestionAssign}
                  onCloseQuestion={handleQuestionClose}
                />
              ))}
            </div>

            {canManageQuestions && (
              <QuestionsPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </CardContent>
        </Card>

        <CreateQuestionForm
          open={showForm}
          loading={loading}
          onClose={() => new Promise<void>((resolve) => {
            setShowForm(false);
            resolve();
          })}
          onSubmit={handleCreateQuestion}
        />

        <AssignOperatorForm
          open={showAssignForm}
          loading={loading}
          operatorsLoading={operatorsLoading}
          question={selectedQuestion}
          operators={operators}
          onClose={() => new Promise<void>((resolve) => {
            setShowAssignForm(false);
            setSelectedQuestion(null);
            resolve();
          })}
          onSubmit={handleAssignOperator}
        />

        <CloseQuestionForm
          open={showCloseForm}
          loading={loading}
          onClose={() => new Promise<void>((resolve) => {
            setShowCloseForm(false);
            setSelectedQuestion(null);
            resolve();
          })}
          onSubmit={handleCloseQuestion}
        />
      </div>
    </Suspense>
  );
}