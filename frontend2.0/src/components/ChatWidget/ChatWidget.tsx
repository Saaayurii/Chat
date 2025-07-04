"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Paperclip, Star, Flag, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../UI/Card';
import { Input } from '../UI/Input';
import { Avatar } from '../UI/Avatar';
import { useSocketIO } from '../../hooks/useSocketIO';
import { useApiCall } from '../../hooks/useApiCall';
import RatingModal from './RatingModal';
import ComplaintModal from './ComplaintModal';
import Button from '../UI/Button';
import { Badge } from '../UI';

interface Message {
  id: string;
  content: string;
  timestamp: Date;
  sender: 'user' | 'operator';
  senderName?: string;
  attachments?: string[];
  type?: 'text' | 'file' | 'system';
}
const API_URL = process.env.NEXT_PUBLIC_API_URL;


interface ChatWidgetProps {
  apiUrl?: string;
  theme?: 'light' | 'dark';
  position?: 'bottom-right' | 'bottom-left';
  primaryColor?: string;
  allowFileUpload?: boolean;
  allowComplaint?: boolean;
  allowRating?: boolean;
  maxFileSize?: number;
  placeholder?: string;
  welcomeMessage?: string;
  operatorName?: string;
  operatorAvatar?: string;
  onClose?: () => void;
  onMinimize?: () => void;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  apiUrl = API_URL,
  theme = 'light',
  position = 'bottom-right',
  primaryColor = '#3b82f6',
  allowFileUpload = true,
  allowComplaint = true,
  allowRating = true,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  placeholder = 'Введите сообщение...',
  welcomeMessage = 'Добро пожаловать! Как могу помочь?',
  operatorName = 'Оператор',
  operatorAvatar,
  onClose,
  onMinimize,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [operatorInfo, setOperatorInfo] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { socket, isConnected: socketConnected } = useSocketIO(`${apiUrl}/chat`, {
    enabled: isOpen && isAuthenticated,
    token: userToken,
  });
  
  const { execute: createConversation } = useApiCall();
  const { execute: sendMessage } = useApiCall();
  const { execute: uploadFile } = useApiCall();
  const { execute: registerVisitor } = useApiCall();

  useEffect(() => {
    if (isOpen && !isAuthenticated) {
      handleGuestRegistration();
    }
  }, [isOpen]);

  useEffect(() => {
    if (socket && conversationId) {
      socket.emit('join-room', { conversationId });
      
      socket.on('new-message', (message: Message) => {
        setMessages(prev => [...prev, message]);
        setIsTyping(false);
      });
      
      socket.on('user-typing', () => {
        setIsTyping(true);
      });
      
      socket.on('user-stopped-typing', () => {
        setIsTyping(false);
      });
      
      socket.on('operator-assigned', (operator: any) => {
        setOperatorInfo(operator);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          content: `Оператор ${operator.name} присоединился к чату`,
          timestamp: new Date(),
          sender: 'operator',
          type: 'system'
        }]);
      });
      
      return () => {
        socket.off('new-message');
        socket.off('user-typing');
        socket.off('user-stopped-typing');
        socket.off('operator-assigned');
      };
    }
  }, [socket, conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleGuestRegistration = async () => {
    try {
      const response = await registerVisitor({
        url: `${apiUrl}/auth/register`,
        method: 'POST',
        data: {
          email: `guest_${Date.now()}@temp.com`,
          password: `temp_${Date.now()}`,
          firstName: 'Посетитель',
          lastName: 'Сайта',
          role: 'VISITOR'
        }
      });
      
      if (response.success) {
        setUserToken(response.data.token);
        setIsAuthenticated(true);
        await handleCreateConversation();
      }
    } catch (error) {
      console.error('Ошибка регистрации посетителя:', error);
    }
  };

  const handleCreateConversation = async () => {
    try {
      const response = await createConversation({
        url: `${apiUrl}/chat/conversations`,
        method: 'POST',
        data: {
          type: 'support',
          title: 'Обращение с сайта'
        },
        headers: {
          Authorization: `Bearer ${userToken}`
        }
      });
      
      if (response.success) {
        setConversationId(response.data.id);
        setMessages([{
          id: 'welcome',
          content: welcomeMessage,
          timestamp: new Date(),
          sender: 'operator',
          senderName: operatorName,
          type: 'system'
        }]);
      }
    } catch (error) {
      console.error('Ошибка создания беседы:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !conversationId) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      timestamp: new Date(),
      sender: 'user',
      type: 'text'
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    
    try {
      if (socket) {
        socket.emit('send-message', {
          conversationId,
          content: inputMessage,
          type: 'text'
        });
      }
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !conversationId) return;
    
    if (file.size > maxFileSize) {
      alert(`Файл слишком большой. Максимальный размер: ${maxFileSize / (1024 * 1024)}MB`);
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await uploadFile({
        url: `${apiUrl}/chat/conversations/${conversationId}/attachments`,
        method: 'POST',
        data: formData,
        headers: {
          Authorization: `Bearer ${userToken}`
        }
      });
      
      if (response.success) {
        const fileMessage: Message = {
          id: Date.now().toString(),
          content: `Файл: ${file.name}`,
          timestamp: new Date(),
          sender: 'user',
          type: 'file',
          attachments: [response.data.url]
        };
        
        setMessages(prev => [...prev, fileMessage]);
        
        if (socket) {
          socket.emit('send-message', {
            conversationId,
            content: `Файл: ${file.name}`,
            type: 'file',
            attachments: [response.data.url]
          });
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки файла:', error);
    }
  };

  const handleRating = async (rating: number, comment?: string) => {
    if (!operatorInfo) return;
    
    try {
      const response = await fetch(`${apiUrl}/ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`
        },
        body: JSON.stringify({
          operatorId: operatorInfo.id,
          rating,
          comment: comment || '',
          conversationId
        })
      });
      
      if (response.ok) {
        setShowRatingModal(false);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          content: `Спасибо за оценку! Ваша оценка: ${rating} звезд`,
          timestamp: new Date(),
          sender: 'operator',
          type: 'system'
        }]);
      }
    } catch (error) {
      console.error('Ошибка отправки оценки:', error);
    }
  };

  const handleComplaint = async (reason: string, details: string) => {
    if (!operatorInfo) return;
    
    try {
      const response = await fetch(`${apiUrl}/complaints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`
        },
        body: JSON.stringify({
          operatorId: operatorInfo.id,
          reason,
          details,
          conversationId
        })
      });
      
      if (response.ok) {
        setShowComplaintModal(false);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          content: 'Ваша жалоба принята и будет рассмотрена',
          timestamp: new Date(),
          sender: 'operator',
          type: 'system'
        }]);
      }
    } catch (error) {
      console.error('Ошибка отправки жалобы:', error);
    }
  };

  const toggleWidget = () => {
    setIsOpen(!isOpen);
    if (onClose && isOpen) onClose();
  };

  const minimizeWidget = () => {
    setIsMinimized(true);
    if (onMinimize) onMinimize();
  };

  const positionClasses = {
    'bottom-right': 'fixed bottom-4 right-4',
    'bottom-left': 'fixed bottom-4 left-4'
  };

  const themeClasses = {
    light: 'bg-white text-gray-900',
    dark: 'bg-gray-800 text-white'
  };

  if (!isOpen) {
    return (
      <div className={`${positionClasses[position]} z-50`}>
        <Button
          onClick={toggleWidget}
          className="rounded-full w-16 h-16 shadow-lg hover:shadow-xl transition-shadow"
          style={{ backgroundColor: primaryColor }}
        >
          <MessageCircle className="w-8 h-8" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`${positionClasses[position]} z-50 w-96 h-[600px]`}>
      <Card className={`${themeClasses[theme]} shadow-2xl border-0 h-full flex flex-col`}>
        <CardHeader className="flex-row items-center justify-between p-4 border-b" style={{ backgroundColor: primaryColor }}>
          <div className="flex items-center space-x-3">
            <Avatar className="w-8 h-8">
              {operatorAvatar ? (
                <img src={operatorAvatar} alt={operatorName} />
              ) : (
                <User className="w-4 h-4" />
              )}
            </Avatar>
            <div>
              <CardTitle className="text-white text-sm">{operatorInfo?.name || operatorName}</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {socketConnected ? 'В сети' : 'Не в сети'}
              </Badge>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={minimizeWidget}
              className="text-white hover:bg-white/20 p-1"
            >
              <X className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleWidget}
              className="text-white hover:bg-white/20 p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 p-0 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.sender === 'user'
                      ? 'bg-blue-500 text-white'
                      : message.type === 'system'
                      ? 'bg-gray-100 text-gray-600 text-center'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  {message.attachments && (
                    <div className="mt-2">
                      {message.attachments.map((attachment, index) => (
                        <a
                          key={index}
                          href={attachment}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-xs"
                        >
                          Вложение {index + 1}
                        </a>
                      ))}
                    </div>
                  )}
                  <div className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-200 rounded-lg p-3 max-w-[80%]">
                  <p className="text-sm text-gray-600">Оператор печатает...</p>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          <div className="border-t p-4 space-y-3">
            <div className="flex items-center space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={placeholder}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1"
              />
              
              {allowFileUpload && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
              )}
              
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className="p-2"
                style={{ backgroundColor: primaryColor }}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            {(allowRating || allowComplaint) && operatorInfo && (
              <div className="flex items-center space-x-2">
                {allowRating && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRatingModal(true)}
                    className="flex items-center space-x-1"
                  >
                    <Star className="w-4 h-4" />
                    <span className="text-xs">Оценить</span>
                  </Button>
                )}
                
                {allowComplaint && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowComplaintModal(true)}
                    className="flex items-center space-x-1"
                  >
                    <Flag className="w-4 h-4" />
                    <span className="text-xs">Жалоба</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileUpload}
      />
      
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onSubmit={handleRating}
        operatorName={operatorInfo?.name || operatorName}
      />
      
      <ComplaintModal
        isOpen={showComplaintModal}
        onClose={() => setShowComplaintModal(false)}
        onSubmit={handleComplaint}
        operatorName={operatorInfo?.name || operatorName}
      />
    </div>
  );
};

export default ChatWidget;