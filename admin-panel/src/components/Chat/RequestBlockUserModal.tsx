'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, AlertTriangle, MessageSquare, Ban, FileText, Send } from 'lucide-react';
import { chatAPI } from '@/core/api';
import Button from '@/components/UI/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/UI/Dialog';
import Badge from '@/components/UI/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/UI/Avatar';

interface RequestBlockUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  conversationId: string;
  onRequestComplete: () => void;
}

const blockReasons = [
  {
    id: 'spam',
    label: 'Спам',
    description: 'Отправка нежелательных сообщений',
    icon: MessageSquare
  },
  {
    id: 'abusive_language',
    label: 'Нецензурная лексика',
    description: 'Использование неприемлемых выражений',
    icon: Ban
  },
  {
    id: 'inappropriate_content',
    label: 'Неадекватное поведение',
    description: 'Агрессивное или неуважительное поведение',
    icon: AlertTriangle
  },
  {
    id: 'other',
    label: 'Другое',
    description: 'Иная причина блокировки',
    icon: FileText
  }
];

export default function RequestBlockUserModal({
  isOpen,
  onClose,
  userId,
  userName,
  userEmail,
  userAvatar,
  conversationId,
  onRequestComplete
}: RequestBlockUserModalProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const queryClient = useQueryClient();

  const requestBlockMutation = useMutation({
    mutationFn: async ({ reason, comment }: { reason: string; comment: string }) => {
      // Отправляем запрос на блокировку вместо прямой блокировки
      const response = await chatAPI.requestUserBlock(userId, {
        reason,
        comment,
        conversationId
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['block-requests'] });
      onRequestComplete();
      onClose();
      resetForm();
    },
    onError: (error) => {
      console.error('Request block user failed:', error);
    }
  });

  const resetForm = () => {
    setSelectedReason(null);
    setComment('');
  };

  const handleRequestBlock = () => {
    if (selectedReason) {
      requestBlockMutation.mutate({ 
        reason: selectedReason,
        comment: comment.trim()
      });
    }
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <span>Запрос на блокировку пользователя</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User info */}
          <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
            <Avatar className="h-12 w-12">
              <AvatarImage src={userAvatar} alt={userName} />
              <AvatarFallback className="bg-destructive text-destructive-foreground">
                {userName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h4 className="font-medium text-foreground">{userName}</h4>
              <p className="text-sm text-muted-foreground">{userEmail}</p>
            </div>
          </div>

          {/* Warning message */}
          <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
              <div>
                <h5 className="font-medium text-orange-800 dark:text-orange-200">
                  Запрос на блокировку
                </h5>
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                  Ваш запрос будет отправлен администратору для рассмотрения. 
                  Пользователь будет заблокирован только после одобрения администратором.
                </p>
              </div>
            </div>
          </div>

          {/* Block reasons */}
          <div className="space-y-3">
            <h5 className="font-medium text-foreground">Причина запроса блокировки:</h5>
            <div className="space-y-2">
              {blockReasons.map((reason) => {
                const Icon = reason.icon;
                return (
                  <div
                    key={reason.id}
                    onClick={() => setSelectedReason(reason.id)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedReason === reason.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <Icon className="w-4 h-4 mt-1 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{reason.label}</p>
                        <p className="text-xs text-muted-foreground">{reason.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Дополнительный комментарий:
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Опишите подробности нарушения..."
              className="w-full h-20 px-3 py-2 border border-input rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground placeholder-muted-foreground"
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={requestBlockMutation.isPending}
            >
              Отмена
            </Button>
            <Button
              onClick={handleRequestBlock}
              disabled={!selectedReason || requestBlockMutation.isPending}
              className="flex-1"
            >
              {requestBlockMutation.isPending ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Отправка...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Send className="w-4 h-4" />
                  <span>Отправить запрос</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}