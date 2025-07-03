'use client';

import { useState, useEffect, Suspense } from 'react';
import { complaintsAPI } from '@/core/api';
import { 
  Complaint, 
  ComplaintStatus, 
  ComplaintType, 
  ComplaintSeverity,
  CreateComplaintData,
  ReviewComplaintData,
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

interface ComplaintsManagementProps {
  userRole?: UserRole;
  showCreateForm?: boolean;
}

export default function ComplaintsManagement({ 
  userRole, 
  showCreateForm = true 
}: ComplaintsManagementProps) {
  const { user } = useAuthStore();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<ComplaintType | ''>('');
  const [severityFilter, setSeverityFilter] = useState<ComplaintSeverity | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CreateComplaintData>({
    type: ComplaintType.INAPPROPRIATE_BEHAVIOR,
    complaintText: '',
    operatorId: '',
    severity: ComplaintSeverity.MEDIUM
  });
  
  // Review form state
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState<ReviewComplaintData>({
    decision: 'resolved',
    adminResponse: '',
    resolutionNotes: '',
    warnOperator: false,
    suspendOperator: false
  });

  const canManageComplaints = user?.role === UserRole.ADMIN;
  const canCreateComplaints = user?.role === UserRole.VISITOR;

  useEffect(() => {
    loadComplaints();
  }, [currentPage, statusFilter, typeFilter, severityFilter, searchQuery]);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage,
        limit: 10,
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { type: typeFilter }),
        ...(severityFilter && { severity: severityFilter }),
        ...(searchQuery && { search: searchQuery }),
        sortBy: 'createdAt',
        sortOrder: 'desc' as const
      };

      let response;
      if (user?.role === UserRole.VISITOR) {
        response = await complaintsAPI.getMyComplaints();
        setComplaints(response.data);
      } else {
        response = await complaintsAPI.getComplaints(params);
        setComplaints(response.data.complaints);
        setTotalPages(Math.ceil(response.data.total / 10));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при загрузке жалоб');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateComplaints) return;

    try {
      setLoading(true);
      await complaintsAPI.createComplaint(formData);
      setShowForm(false);
      setFormData({
        type: ComplaintType.INAPPROPRIATE_BEHAVIOR,
        complaintText: '',
        operatorId: '',
        severity: ComplaintSeverity.MEDIUM
      });
      loadComplaints();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при создании жалобы');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint || !canManageComplaints) return;

    try {
      setLoading(true);
      await complaintsAPI.reviewComplaint(selectedComplaint._id, reviewData);
      setShowReviewForm(false);
      setSelectedComplaint(null);
      setReviewData({
        decision: 'resolved',
        adminResponse: '',
        resolutionNotes: '',
        warnOperator: false,
        suspendOperator: false
      });
      loadComplaints();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при рассмотрении жалобы');
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status: ComplaintStatus) => {
    switch (status) {
      case ComplaintStatus.PENDING: return 'secondary';
      case ComplaintStatus.UNDER_REVIEW: return 'default';
      case ComplaintStatus.RESOLVED: return 'default';
      case ComplaintStatus.DISMISSED: return 'outline';
      default: return 'outline';
    }
  };

  const getSeverityVariant = (severity: ComplaintSeverity) => {
    switch (severity) {
      case ComplaintSeverity.LOW: return 'default';
      case ComplaintSeverity.MEDIUM: return 'secondary';
      case ComplaintSeverity.HIGH: return 'default';
      case ComplaintSeverity.CRITICAL: return 'destructive';
      default: return 'outline';
    }
  };

  const getTypeDisplay = (type: ComplaintType) => {
    const typeMap = {
      [ComplaintType.INAPPROPRIATE_BEHAVIOR]: 'Неподобающее поведение',
      [ComplaintType.POOR_SERVICE]: 'Плохой сервис',
      [ComplaintType.UNPROFESSIONAL_CONDUCT]: 'Непрофессиональное поведение',
      [ComplaintType.DELAYED_RESPONSE]: 'Задержка ответа',
      [ComplaintType.INCORRECT_INFORMATION]: 'Неверная информация',
      [ComplaintType.OTHER]: 'Другое'
    };
    return typeMap[type] || type;
  };

  if (loading && complaints.length === 0) {
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
                {user?.role === UserRole.VISITOR ? 'Мои жалобы' : 'Управление жалобами'}
              </CardTitle>
              {canCreateComplaints && showCreateForm && (
                <Button
                  onClick={() => setShowForm(true)}
                  variant="destructive"
                >
                  Подать жалобу
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Filters */}
            {canManageComplaints && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ComplaintStatus | '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Все статусы" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Все статусы</SelectItem>
                    <SelectItem value={ComplaintStatus.PENDING}>Ожидает</SelectItem>
                    <SelectItem value={ComplaintStatus.UNDER_REVIEW}>На рассмотрении</SelectItem>
                    <SelectItem value={ComplaintStatus.RESOLVED}>Решена</SelectItem>
                    <SelectItem value={ComplaintStatus.DISMISSED}>Отклонена</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as ComplaintType | '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Все типы" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Все типы</SelectItem>
                    <SelectItem value={ComplaintType.INAPPROPRIATE_BEHAVIOR}>Неподобающее поведение</SelectItem>
                    <SelectItem value={ComplaintType.POOR_SERVICE}>Плохой сервис</SelectItem>
                    <SelectItem value={ComplaintType.UNPROFESSIONAL_CONDUCT}>Непрофессиональное поведение</SelectItem>
                    <SelectItem value={ComplaintType.DELAYED_RESPONSE}>Задержка ответа</SelectItem>
                    <SelectItem value={ComplaintType.INCORRECT_INFORMATION}>Неверная информация</SelectItem>
                    <SelectItem value={ComplaintType.OTHER}>Другое</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={severityFilter} onValueChange={(value) => setSeverityFilter(value as ComplaintSeverity | '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Все уровни" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Все уровни</SelectItem>
                    <SelectItem value={ComplaintSeverity.LOW}>Низкий</SelectItem>
                    <SelectItem value={ComplaintSeverity.MEDIUM}>Средний</SelectItem>
                    <SelectItem value={ComplaintSeverity.HIGH}>Высокий</SelectItem>
                    <SelectItem value={ComplaintSeverity.CRITICAL}>Критический</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Поиск..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-input"
                />
              </div>
            )}

            {/* Complaints List */}
            <div className="space-y-4">
              {complaints.map((complaint) => (
                <Card key={complaint._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-foreground">{getTypeDisplay(complaint.type)}</h3>
                        <p className="text-foreground mt-2">{complaint.complaintText}</p>
                        {complaint.adminResponse && (
                          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                            <p className="font-medium text-foreground">Ответ администратора:</p>
                            <p className="text-muted-foreground">{complaint.adminResponse}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 flex-col">
                        <Badge variant={getStatusVariant(complaint.status)}>
                          {complaint.status}
                        </Badge>
                        <Badge variant={getSeverityVariant(complaint.severity)}>
                          {complaint.severity}
                        </Badge>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground mb-3">
                      <p>Создана: {new Date(complaint.createdAt).toLocaleString()}</p>
                      {complaint.reviewedAt && (
                        <p>Рассмотрена: {new Date(complaint.reviewedAt).toLocaleString()}</p>
                      )}
                      {complaint.resolvedAt && (
                        <p>Решена: {new Date(complaint.resolvedAt).toLocaleString()}</p>
                      )}
                      {complaint.operatorWarned && (
                        <p className="text-orange-600 dark:text-orange-400">Оператор предупрежден</p>
                      )}
                      {complaint.operatorSuspended && (
                        <p className="text-red-600 dark:text-red-400">Оператор заблокирован</p>
                      )}
                    </div>

                    {canManageComplaints && complaint.status === ComplaintStatus.PENDING && (
                      <Button
                        onClick={() => {
                          setSelectedComplaint(complaint);
                          setShowReviewForm(true);
                        }}
                        size="sm"
                      >
                        Рассмотреть жалобу
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {canManageComplaints && totalPages > 1 && (
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

        {/* Create Complaint Form */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Подать жалобу</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateComplaint} className="space-y-4">
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as ComplaintType })}>
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
                onChange={(e) => setFormData({ ...formData, complaintText: e.target.value })}
                className="w-full border border-input rounded-md px-3 py-2 h-32 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                required
              />

              <Input
                placeholder="ID оператора"
                value={formData.operatorId}
                onChange={(e) => setFormData({ ...formData, operatorId: e.target.value })}
                required
              />
              
              <Select value={formData.severity} onValueChange={(value) => setFormData({ ...formData, severity: value as ComplaintSeverity })}>
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
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Отмена
                </Button>
                <Button type="submit" disabled={loading} variant="destructive">
                  {loading ? 'Отправка...' : 'Отправить жалобу'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Review Complaint Form */}
        <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Рассмотреть жалобу</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleReviewComplaint} className="space-y-4">
              <Select value={reviewData.decision} onValueChange={(value) => setReviewData({ ...reviewData, decision: value as 'resolved' | 'dismissed' })}>
                <SelectTrigger>
                  <SelectValue placeholder="Решение" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resolved">Принять жалобу</SelectItem>
                  <SelectItem value="dismissed">Отклонить жалобу</SelectItem>
                </SelectContent>
              </Select>

              <textarea
                placeholder="Ответ администратора..."
                value={reviewData.adminResponse}
                onChange={(e) => setReviewData({ ...reviewData, adminResponse: e.target.value })}
                className="w-full border border-input rounded-md px-3 py-2 h-24 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                required
              />

              <textarea
                placeholder="Заметки по решению (необязательно)"
                value={reviewData.resolutionNotes}
                onChange={(e) => setReviewData({ ...reviewData, resolutionNotes: e.target.value })}
                className="w-full border border-input rounded-md px-3 py-2 h-20 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={reviewData.warnOperator}
                    onChange={(e) => setReviewData({ ...reviewData, warnOperator: e.target.checked })}
                    className="rounded border-input"
                  />
                  <span className="text-foreground">Предупредить оператора</span>
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={reviewData.suspendOperator}
                    onChange={(e) => setReviewData({ ...reviewData, suspendOperator: e.target.checked })}
                    className="rounded border-input"
                  />
                  <span className="text-foreground">Заблокировать оператора</span>
                </label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowReviewForm(false)}>
                  Отмена
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Обработка...' : 'Принять решение'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Suspense>
  );
}