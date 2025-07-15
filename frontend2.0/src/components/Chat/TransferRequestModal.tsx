'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Check, AlertTriangle, MessageSquare, User } from 'lucide-react';
import { chatAPI } from '@/core/api';
import Button from '@/components/UI/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/UI/Dialog';
import { Badge } from '@/components/UI/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/UI/Avatar';

interface TransferRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  transferRequest: {
    id: string;
    fromOperator: {
      id: string;
      name: string;
      avatar?: string;
    };
    visitor: {
      id: string;
      name: string;
      email: string;
      avatar?: string;
    };
    conversationId: string;
    reason?: string;
    timestamp: string;
  };
  onRequestProcessed: () => void;
}

export default function TransferRequestModal({
  isOpen,
  onClose,
  transferRequest,
  onRequestProcessed
}: TransferRequestModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  const respondToTransferMutation = useMutation({
    mutationFn: async ({ accept }: { accept: boolean }) => {
      const response = await chatAPI.respondToTransfer(transferRequest.id, accept);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['transfer-requests'] });
      onRequestProcessed();
      onClose();
    },
    onError: (error) => {
      console.error('Transfer response failed:', error);
    }
  });

  const handleAccept = () => {
    setIsProcessing(true);
    respondToTransferMutation.mutate({ accept: true });
  };

  const handleReject = () => {
    setIsProcessing(true);
    respondToTransferMutation.mutate({ accept: false });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <span>Предложение о принятии посетителя</span>
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
          {/* From operator info */}
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center space-x-3 mb-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">От оператора:</span>
            </div>
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={transferRequest.fromOperator.avatar} alt={transferRequest.fromOperator.name} />
                <AvatarFallback>
                  {transferRequest.fromOperator.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">{transferRequest.fromOperator.name}</p>
                <Badge variant="outline" className="text-xs">
                  Оператор
                </Badge>
              </div>
            </div>
          </div>

          {/* Visitor info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex items-center space-x-3 mb-2">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-foreground">Посетитель для передачи:</span>
            </div>
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={transferRequest.visitor.avatar} alt={transferRequest.visitor.name} />
                <AvatarFallback>
                  {transferRequest.visitor.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-medium text-foreground">{transferRequest.visitor.name}</h4>
                <p className="text-sm text-muted-foreground">{transferRequest.visitor.email}</p>
                <Badge variant="secondary" className="mt-1">
                  Посетитель
                </Badge>
              </div>
            </div>
          </div>

          {/* Transfer reason */}
          {transferRequest.reason && (
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium text-foreground">Причина передачи:</span>
              </div>
              <p className="text-sm text-foreground pl-6">{transferRequest.reason}</p>
            </div>
          )}

          {/* Timestamp */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Запрос отправлен: {new Date(transferRequest.timestamp).toLocaleString()}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex space-x-3 pt-4 border-t">
            <Button
              onClick={handleReject}
              variant="outline"
              disabled={isProcessing || respondToTransferMutation.isPending}
              className="flex-1"
            >
              {isProcessing && !respondToTransferMutation.isSuccess ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Отклоняю...
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Отклонить
                </>
              )}
            </Button>
            
            <Button
              onClick={handleAccept}
              disabled={isProcessing || respondToTransferMutation.isPending}
              className="flex-1"
            >
              {isProcessing && !respondToTransferMutation.isSuccess ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Принимаю...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Принять
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}