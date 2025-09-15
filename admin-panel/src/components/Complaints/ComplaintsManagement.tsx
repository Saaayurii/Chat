'use client';

import React, { Suspense } from 'react';
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
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Alert
} from '@/components/UI';
import Button from '../UI/Button';
import ComplaintCard from './ComplaintCard';
import ComplaintFilters from './ComplaintFilters';
import CreateComplaintForm from './CreateComplaintForm';
import ReviewComplaintForm from './ReviewComplaintForm';
import ComplaintsPagination from './ComplaintsPagination';

interface ComplaintsManagementProps {
  userRole?: typeof UserRole[keyof typeof UserRole];
  showCreateForm?: boolean;
}

export default ({ userRole, showCreateForm = true }: ComplaintsManagementProps) => {
  var { user } = useAuthStore();
  var [state, setState] = React.useState({ 
    0: [], 
    1: false, 
    2: null, 
    3: 1, 
    4: 1, 
    5: '', 
    6: '', 
    7: '', 
    8: '', 
    9: false,
    10: {
      type: ComplaintType.INAPPROPRIATE_BEHAVIOR,
      complaintText: '',
      operatorId: '',
      severity: ComplaintSeverity.MEDIUM
    },
    11: null,
    12: false,
    13: {
      decision: 'resolved' as 'resolved' | 'dismissed',
      adminResponse: '',
      resolutionNotes: '' as string | undefined,
      warnOperator: false,
      suspendOperator: false
    }
  });

  var canManageComplaints = user?.role === UserRole.ADMIN;
  var canCreateComplaints = user?.role === UserRole.VISITOR;

  var loadComplaints = () => {
    return new Promise((resolve, reject) => {
      setState(prev => ({ ...prev, 1: true, 2: null }));
      
      var params = {
        page: state[3],
        limit: 10,
        ...(state[5] && { status: state[5] }),
        ...(state[6] && { type: state[6] }),
        ...(state[7] && { severity: state[7] }),
        ...(state[8] && { search: state[8] }),
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      var apiCall = user?.role === UserRole.VISITOR 
        ? complaintsAPI.getMyComplaints()
        : complaintsAPI.getComplaints(params as any);

      apiCall
        .then(response => {
          user?.role === UserRole.VISITOR 
            ? setState(prev => ({ ...prev, 0: response.data as any }))
            : setState(prev => ({ 
                ...prev, 
                0: (response.data as any).complaints,
                4: Math.ceil((response.data as any).total / 10)
              }));
          resolve(response);
        })
        .catch(err => {
          setState(prev => ({ 
            ...prev, 
            2: err.response?.data?.message || 'Ошибка при загрузке жалоб' 
          }));
          reject(err);
        })
        .finally(() => {
          setState(prev => ({ ...prev, 1: false }));
        });
    });
  };

  var handleCreateComplaint = (e: any) => {
    e.preventDefault();
    return canCreateComplaints ? 
      new Promise((resolve, reject) => {
        setState(prev => ({ ...prev, 1: true }));
        complaintsAPI.createComplaint(state[10])
          .then(() => {
            setState(prev => ({ 
              ...prev, 
              9: false,
              10: {
                type: ComplaintType.INAPPROPRIATE_BEHAVIOR,
                complaintText: '',
                operatorId: '',
                severity: ComplaintSeverity.MEDIUM
              }
            }));
            return loadComplaints();
          })
          .then(resolve)
          .catch(err => {
            setState(prev => ({ 
              ...prev, 
              2: err.response?.data?.message || 'Ошибка при создании жалобы' 
            }));
            reject(err);
          })
          .finally(() => {
            setState(prev => ({ ...prev, 1: false }));
          });
      }) : Promise.resolve();
  };

  var handleReviewComplaint = (e: any) => {
    e.preventDefault();
    return state[11] && canManageComplaints ?
      new Promise((resolve, reject) => {
        setState(prev => ({ ...prev, 1: true }));
        complaintsAPI.reviewComplaint((state[11] as any)._id, state[13])
          .then(() => {
            setState(prev => ({ 
              ...prev, 
              12: false,
              11: null,
              13: {
                decision: 'resolved',
                adminResponse: '',
                resolutionNotes: '',
                warnOperator: false,
                suspendOperator: false
              }
            }));
            return loadComplaints();
          })
          .then(resolve)
          .catch(err => {
            setState(prev => ({ 
              ...prev, 
              2: err.response?.data?.message || 'Ошибка при рассмотрении жалобы' 
            }));
            reject(err);
          })
          .finally(() => {
            setState(prev => ({ ...prev, 1: false }));
          });
      }) : Promise.resolve();
  };

  React.useEffect(() => {
    loadComplaints();
  }, [state[3], state[5], state[6], state[7], state[8]]);

  return state[1] && state[0].length === 0 ? (
    <div className="flex justify-center p-8">
      <div className="text-muted-foreground">Загрузка...</div>
    </div>
  ) : (
    <Suspense fallback={<div className="flex justify-center p-8"><div className="text-muted-foreground">Загрузка...</div></div>}>
      <div className="space-y-6">
        {state[2] && (
          <Alert variant="destructive">
            {state[2]}
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
                  onClick={() => setState(prev => ({ ...prev, 9: true }))}
                  variant="destructive"
                >
                  Подать жалобу
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {canManageComplaints && (
              <ComplaintFilters
                statusFilter={state[5] as any}
                typeFilter={state[6] as any}
                severityFilter={state[7] as any}
                searchQuery={state[8]}
                onStatusChange={(value) => setState(prev => ({ ...prev, 5: value as any }))}
                onTypeChange={(value) => setState(prev => ({ ...prev, 6: value as any }))}
                onSeverityChange={(value) => setState(prev => ({ ...prev, 7: value as any }))}
                onSearchChange={(value) => setState(prev => ({ ...prev, 8: value }))}
              />
            )}

            <div className="space-y-4">
              {(state[0] as any[]).map((complaint: any) => (
                <ComplaintCard
                  key={complaint._id}
                  complaint={complaint}
                  canManageComplaints={canManageComplaints}
                  onReview={(complaint) => {
                    setState(prev => ({ ...prev, 11: complaint as any, 12: true }));
                  }}
                />
              ))}
            </div>

            {canManageComplaints && (
              <ComplaintsPagination
                currentPage={state[3]}
                totalPages={state[4]}
                onPageChange={(page) => setState(prev => ({ ...prev, 3: page }))}
              />
            )}
          </CardContent>
        </Card>

        <CreateComplaintForm
          open={state[9]}
          onOpenChange={(open) => setState(prev => ({ ...prev, 9: open }))}
          formData={state[10]}
          onFormDataChange={(data) => setState(prev => ({ ...prev, 10: data as any }))}
          onSubmit={handleCreateComplaint}
          loading={state[1]}
        />

        <ReviewComplaintForm
          open={state[12]}
          onOpenChange={(open) => setState(prev => ({ ...prev, 12: open }))}
          reviewData={state[13]}
          onReviewDataChange={(data) => setState(prev => ({ ...prev, 13: data as any }))}
          onSubmit={handleReviewComplaint}
          loading={state[1]}
        />
      </div>
    </Suspense>
  );
};