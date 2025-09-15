'use client';

import { Card, CardContent, Badge } from '@/components/UI';
import Button from '../UI/Button';
import { 
  Complaint, 
  ComplaintStatus, 
  ComplaintType, 
  ComplaintSeverity 
} from '@/types';

interface ComplaintCardProps {
  complaint: Complaint;
  canManageComplaints: boolean;
  onReview: (complaint: Complaint) => void;
}

var getTypeDisplay = (type: typeof ComplaintType[keyof typeof ComplaintType]) => {
  var typeMap = {
    [ComplaintType.INAPPROPRIATE_BEHAVIOR]: 'Неподобающее поведение',
    [ComplaintType.POOR_SERVICE]: 'Плохой сервис',
    [ComplaintType.UNPROFESSIONAL_CONDUCT]: 'Непрофессиональное поведение',
    [ComplaintType.DELAYED_RESPONSE]: 'Задержка ответа',
    [ComplaintType.INCORRECT_INFORMATION]: 'Неверная информация',
    [ComplaintType.OTHER]: 'Другое'
  };
  return (typeMap as any)[type] || type;
};

var getStatusVariant = (status: typeof ComplaintStatus[keyof typeof ComplaintStatus]) => {
  switch (status) {
    case ComplaintStatus.PENDING: return 'secondary';
    case ComplaintStatus.UNDER_REVIEW: return 'default';
    case ComplaintStatus.RESOLVED: return 'default';
    case ComplaintStatus.DISMISSED: return 'outline';
    default: return 'outline';
  }
};

var getSeverityVariant = (severity: typeof ComplaintSeverity[keyof typeof ComplaintSeverity]) => {
  switch (severity) {
    case ComplaintSeverity.LOW: return 'default';
    case ComplaintSeverity.MEDIUM: return 'secondary';
    case ComplaintSeverity.HIGH: return 'default';
    case ComplaintSeverity.CRITICAL: return 'destructive';
    default: return 'outline';
  }
};

export default ({ complaint, canManageComplaints, onReview }: ComplaintCardProps) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-4">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-foreground">
            {getTypeDisplay(complaint.type)}
          </h3>
          <p className="text-foreground mt-2">{complaint.complaintText}</p>
          {complaint.adminResponse && (
            <div className="mt-3 p-3 bg-muted/50 rounded-lg">
              <p className="font-medium text-foreground">Ответ администратора:</p>
              <p className="text-muted-foreground">{complaint.adminResponse}</p>
            </div>
          )}
        </div>
        <div className="flex gap-2 flex-col">
          <Badge variant={getStatusVariant(complaint.status) as any}>
            {complaint.status}
          </Badge>
          <Badge variant={getSeverityVariant(complaint.severity) as any}>
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
        <Button onClick={() => onReview(complaint)} size="sm">
          Рассмотреть жалобу
        </Button>
      )}
    </CardContent>
  </Card>
);