'use client';

import { useState, useEffect } from 'react';
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

  const getStatusColor = (status: ComplaintStatus) => {
    switch (status) {
      case ComplaintStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
      case ComplaintStatus.UNDER_REVIEW: return 'bg-blue-100 text-blue-800';
      case ComplaintStatus.RESOLVED: return 'bg-green-100 text-green-800';
      case ComplaintStatus.DISMISSED: return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: ComplaintSeverity) => {
    switch (severity) {
      case ComplaintSeverity.LOW: return 'bg-green-100 text-green-800';
      case ComplaintSeverity.MEDIUM: return 'bg-yellow-100 text-yellow-800';
      case ComplaintSeverity.HIGH: return 'bg-orange-100 text-orange-800';
      case ComplaintSeverity.CRITICAL: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
          {user?.role === UserRole.VISITOR ? 'Мои жалобы' : 'Управление жалобами'}
        </h2>
        {canCreateComplaints && showCreateForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Подать жалобу
          </button>
        )}
      </div>

      {/* Filters */}
      {canManageComplaints && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ComplaintStatus | '')}
            className="border rounded px-3 py-2"
          >
            <option value="">Все статусы</option>
            <option value={ComplaintStatus.PENDING}>Ожидает</option>
            <option value={ComplaintStatus.UNDER_REVIEW}>На рассмотрении</option>
            <option value={ComplaintStatus.RESOLVED}>Решена</option>
            <option value={ComplaintStatus.DISMISSED}>Отклонена</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ComplaintType | '')}
            className="border rounded px-3 py-2"
          >
            <option value="">Все типы</option>
            <option value={ComplaintType.INAPPROPRIATE_BEHAVIOR}>Неподобающее поведение</option>
            <option value={ComplaintType.POOR_SERVICE}>Плохой сервис</option>
            <option value={ComplaintType.UNPROFESSIONAL_CONDUCT}>Непрофессиональное поведение</option>
            <option value={ComplaintType.DELAYED_RESPONSE}>Задержка ответа</option>
            <option value={ComplaintType.INCORRECT_INFORMATION}>Неверная информация</option>
            <option value={ComplaintType.OTHER}>Другое</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as ComplaintSeverity | '')}
            className="border rounded px-3 py-2"
          >
            <option value="">Все уровни</option>
            <option value={ComplaintSeverity.LOW}>Низкий</option>
            <option value={ComplaintSeverity.MEDIUM}>Средний</option>
            <option value={ComplaintSeverity.HIGH}>Высокий</option>
            <option value={ComplaintSeverity.CRITICAL}>Критический</option>
          </select>

          <input
            type="text"
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>
      )}

      {/* Complaints List */}
      <div className="space-y-4">
        {complaints.map((complaint) => (
          <div key={complaint._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{getTypeDisplay(complaint.type)}</h3>
                <p className="text-gray-700 mt-2">{complaint.complaintText}</p>
                {complaint.adminResponse && (
                  <div className="mt-3 p-3 bg-blue-50 rounded">
                    <p className="font-medium text-blue-800">Ответ администратора:</p>
                    <p className="text-blue-700">{complaint.adminResponse}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 flex-col">
                <span className={`px-2 py-1 rounded text-sm text-center ${getStatusColor(complaint.status)}`}>
                  {complaint.status}
                </span>
                <span className={`px-2 py-1 rounded text-sm text-center ${getSeverityColor(complaint.severity)}`}>
                  {complaint.severity}
                </span>
              </div>
            </div>

            <div className="text-sm text-gray-500 mb-3">
              <p>Создана: {new Date(complaint.createdAt).toLocaleString()}</p>
              {complaint.reviewedAt && (
                <p>Рассмотрена: {new Date(complaint.reviewedAt).toLocaleString()}</p>
              )}
              {complaint.resolvedAt && (
                <p>Решена: {new Date(complaint.resolvedAt).toLocaleString()}</p>
              )}
              {complaint.operatorWarned && (
                <p className="text-orange-600">Оператор предупрежден</p>
              )}
              {complaint.operatorSuspended && (
                <p className="text-red-600">Оператор заблокирован</p>
              )}
            </div>

            {canManageComplaints && complaint.status === ComplaintStatus.PENDING && (
              <button
                onClick={() => {
                  setSelectedComplaint(complaint);
                  setShowReviewForm(true);
                }}
                className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
              >
                Рассмотреть жалобу
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {canManageComplaints && totalPages > 1 && (
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

      {/* Create Complaint Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Подать жалобу</h3>
            <form onSubmit={handleCreateComplaint} className="space-y-4">
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as ComplaintType })}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value={ComplaintType.INAPPROPRIATE_BEHAVIOR}>Неподобающее поведение</option>
                <option value={ComplaintType.POOR_SERVICE}>Плохой сервис</option>
                <option value={ComplaintType.UNPROFESSIONAL_CONDUCT}>Непрофессиональное поведение</option>
                <option value={ComplaintType.DELAYED_RESPONSE}>Задержка ответа</option>
                <option value={ComplaintType.INCORRECT_INFORMATION}>Неверная информация</option>
                <option value={ComplaintType.OTHER}>Другое</option>
              </select>

              <textarea
                placeholder="Опишите суть жалобы..."
                value={formData.complaintText}
                onChange={(e) => setFormData({ ...formData, complaintText: e.target.value })}
                className="w-full border rounded px-3 py-2 h-32"
                required
              />

              <input
                type="text"
                placeholder="ID оператора"
                value={formData.operatorId}
                onChange={(e) => setFormData({ ...formData, operatorId: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
              
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value as ComplaintSeverity })}
                className="w-full border rounded px-3 py-2"
              >
                <option value={ComplaintSeverity.LOW}>Низкая серьезность</option>
                <option value={ComplaintSeverity.MEDIUM}>Средняя серьезность</option>
                <option value={ComplaintSeverity.HIGH}>Высокая серьезность</option>
                <option value={ComplaintSeverity.CRITICAL}>Критическая серьезность</option>
              </select>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600 disabled:opacity-50"
                >
                  {loading ? 'Отправка...' : 'Отправить жалобу'}
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

      {/* Review Complaint Form */}
      {showReviewForm && selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Рассмотреть жалобу</h3>
            <form onSubmit={handleReviewComplaint} className="space-y-4">
              <select
                value={reviewData.decision}
                onChange={(e) => setReviewData({ ...reviewData, decision: e.target.value as 'resolved' | 'dismissed' })}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="resolved">Принять жалобу</option>
                <option value="dismissed">Отклонить жалобу</option>
              </select>

              <textarea
                placeholder="Ответ администратора..."
                value={reviewData.adminResponse}
                onChange={(e) => setReviewData({ ...reviewData, adminResponse: e.target.value })}
                className="w-full border rounded px-3 py-2 h-24"
                required
              />

              <textarea
                placeholder="Заметки по решению (необязательно)"
                value={reviewData.resolutionNotes}
                onChange={(e) => setReviewData({ ...reviewData, resolutionNotes: e.target.value })}
                className="w-full border rounded px-3 py-2 h-20"
              />

              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={reviewData.warnOperator}
                    onChange={(e) => setReviewData({ ...reviewData, warnOperator: e.target.checked })}
                  />
                  <span>Предупредить оператора</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={reviewData.suspendOperator}
                    onChange={(e) => setReviewData({ ...reviewData, suspendOperator: e.target.checked })}
                  />
                  <span>Заблокировать оператора</span>
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? 'Обработка...' : 'Принять решение'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
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