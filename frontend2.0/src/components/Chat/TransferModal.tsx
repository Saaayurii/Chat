'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, User, UserCheck, UserX, Coffee, WifiOff } from 'lucide-react';
import { chatAPI } from '@/core/api';
import { UserRole } from '@/types';
import Button from '@/components/UI/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/UI/Avatar';
import Badge from '@/components/UI/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/UI/Dialog';
import { PresenceAvatar, PresenceStatus } from '@/components/Presence';

interface Operator {
  id: string;
  email: string;
  profile: {
    username: string;
    fullName: string;
    avatarUrl?: string;
    isOnline: boolean;
    status?: 'free' | 'busy' | 'break' | 'offline';
  };
  role: UserRole;
  activeChats: number;
  lastActivity: string;
}

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  visitorId: string;
  visitorName: string;
  conversationId: string;
  onTransferComplete: () => void;
}

export default function TransferModal({
  isOpen,
  onClose,
  visitorId,
  visitorName,
  conversationId,
  onTransferComplete
}: TransferModalProps) {
  const [selectedOperator, setSelectedOperator] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: operators, isLoading } = useQuery({
    queryKey: ['operators', 'available'],
    queryFn: async () => {
      const response = await chatAPI.getOperators();
      return response.data;
    },
    enabled: isOpen
  });

  const transferMutation = useMutation({
    mutationFn: async ({ operatorId }: { operatorId: string }) => {
      const response = await chatAPI.transferChat(conversationId, operatorId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      onTransferComplete();
      onClose();
    },
    onError: (error) => {
      console.error('Transfer failed:', error);
    }
  });

  const handleTransfer = () => {
    if (selectedOperator) {
      transferMutation.mutate({ operatorId: selectedOperator });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'free':
        return <UserCheck className="h-4 w-4 text-green-500" />;
      case 'busy':
        return <User className="h-4 w-4 text-yellow-500" />;
      case 'break':
        return <Coffee className="h-4 w-4 text-blue-500" />;
      case 'offline':
        return <WifiOff className="h-4 w-4 text-gray-500" />;
      default:
        return <UserX className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'free':
        return 'Свободен';
      case 'busy':
        return 'Занят';
      case 'break':
        return 'Перерыв';
      case 'offline':
        return 'Не в сети';
      default:
        return 'Неизвестно';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'free':
        return 'success';
      case 'busy':
        return 'warning';
      case 'break':
        return 'info';
      case 'offline':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const canAssign = (operator: Operator) => {
    return operator.profile.status === 'free' || operator.profile.status === 'busy';
  };

  const getPresenceStatus = (status: string) => {
    switch (status) {
      case 'free':
      case 'busy':
        return PresenceStatus.ONLINE;
      case 'break':
        return PresenceStatus.AWAY;
      case 'offline':
        return PresenceStatus.OFFLINE;
      default:
        return PresenceStatus.OFFLINE;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              Перенаправить чат посетителя "{visitorName}"
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm text-muted-foreground">
              Выберите оператора для назначения обработки сообщения от посетителя.
              Активная кнопка "Назначить" доступна только для операторов со статусом "свободен".
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {operators?.map((operator: Operator) => (
                <div
                  key={operator.id}
                  className={`p-4 rounded-lg border transition-all cursor-pointer ${
                    selectedOperator === operator.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                  onClick={() => setSelectedOperator(operator.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <PresenceAvatar
                        userId={operator.id}
                        userName={operator.profile.fullName || operator.profile.username}
                        avatar={operator.profile.avatarUrl}
                        status={getPresenceStatus(operator.profile.status || 'offline')}
                        size="md"
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-foreground">
                            {operator.profile.fullName || operator.profile.username}
                          </h4>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(operator.profile.status || 'offline')}
                            <span className="text-sm text-muted-foreground">
                              {getStatusText(operator.profile.status || 'offline')}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 mt-1">
                          <p className="text-sm text-muted-foreground">
                            {operator.email}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            Активных чатов: {operator.activeChats || 0}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-2">
                      <Badge variant={getStatusColor(operator.profile.status || 'offline') as any}>
                        {getStatusText(operator.profile.status || 'offline')}
                      </Badge>
                      
                      <Button
                        size="sm"
                        disabled={!canAssign(operator) || transferMutation.isPending}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOperator(operator.id);
                        }}
                        className={`${
                          canAssign(operator) 
                            ? 'bg-green-600 hover:bg-green-700' 
                            : 'bg-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {canAssign(operator) ? 'Назначить' : 'Недоступен'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={transferMutation.isPending}
            >
              Отмена
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={!selectedOperator || transferMutation.isPending}
            >
              {transferMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Перенаправляю...
                </>
              ) : (
                'Перенаправить чат'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}