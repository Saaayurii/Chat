'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, AlertTriangle, MessageSquare, Ban, FileText } from 'lucide-react';
import { chatAPI } from '@/core/api';
import Button from '@/components/UI/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/UI/Dialog';
import Badge from '@/components/UI/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/UI/Avatar';

interface BlockUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  conversationId: string;
  onBlockComplete: () => void;
}

const blockReasons = [
  {
    id: 'spam',
    label: 'Спам',
    description: 'Отправка нежелательных сообщений',
    icon: MessageSquare
  },
  {
    id: 'inappropriate_language',
    label: 'Нецензурная лексика',
    description: 'Использование неприемлемых выражений',
    icon: Ban
  },
  {
    id: 'inappropriate_behavior',
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

export default function BlockUserModal({
  isOpen,
  onClose,
  userId,
  userName,
  userEmail,
  userAvatar,
  conversationId,
  onBlockComplete
}: BlockUserModalProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const queryClient = useQueryClient();

  const blockMutation = useMutation({
    mutationFn: async ({ reason, comment }: { reason: string; comment: string }) => {
      const response = await chatAPI.blockUser(userId, {
        reason,
        comment,
        conversationId
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['blacklist'] });
      onBlockComplete();
      onClose();
      resetForm();
    },
    onError: (error) => {
      console.error('Block user failed:', error);
    }
  });

  const resetForm = () => {
    setSelectedReason(null);
    setComment('');
  };

  const handleBlock = () => {
    if (selectedReason) {
      const reason = blockReasons.find(r => r.id === selectedReason);
      blockMutation.mutate({ 
        reason: reason?.label || selectedReason,
        comment: comment.trim()
      });
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span>Заблокировать пользователя</span>
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-6 w-6"
            >
             
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* User info */}
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={userAvatar} alt={userName} />
                <AvatarFallback>
                  {userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-medium text-foreground">{userName}</h4>
                <p className="text-sm text-muted-foreground">{userEmail}</p>
                <Badge variant="destructive" className="mt-1">
                  Будет заблокирован
                </Badge>
              </div>
            </div>
          </div>

          {/* Reason selection */}
          <div>
            <h4 className="font-medium text-foreground mb-3">
              Причина блокировки <span className="text-red-500">*</span>
            </h4>
            <div className="space-y-2">
              {blockReasons.map((reason) => {
                const IconComponent = reason.icon;
                return (
                  <div
                    key={reason.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedReason === reason.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground'
                    }`}
                    onClick={() => setSelectedReason(reason.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <IconComponent className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">{reason.label}</p>
                        <p className="text-sm text-muted-foreground">{reason.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Comment */}
          <div>
            <h4 className="font-medium text-foreground mb-2">
              Дополнительный комментарий (опционально)
            </h4>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Укажите дополнительные детали..."
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {comment.length}/500
            </p>
          </div>

          {/* Warning */}
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  Предупреждение
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Данное предложение о блокировке посетителя будет отправлено администратору на рассмотрение.
                  Окончательное решение о блокировке принимает администратор.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={blockMutation.isPending}
            >
              Отмена
            </Button>
            <Button
              onClick={handleBlock}
              disabled={!selectedReason || blockMutation.isPending}
              variant="destructive"
            >
              {blockMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Отправляю...
                </>
              ) : (
                'Отправить на блокировку'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}