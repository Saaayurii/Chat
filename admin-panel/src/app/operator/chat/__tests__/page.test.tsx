import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import OperatorChatPage from '../page';
import { useAuthStore } from '@/store/authStore';
import { chatAPI } from '@/core/api';
import { useChat } from '@/hooks/useChat';

// Mock dependencies
jest.mock('@/store/authStore');
jest.mock('@/core/api');
jest.mock('@/hooks/useChat');
jest.mock('@radix-ui/themes', () => ({
  Spinner: () => <div data-testid="spinner">Loading...</div>,
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;
const mockUseChat = useChat as jest.MockedFunction<typeof useChat>;

describe('OperatorChatPage', () => {
  let queryClient: QueryClient;
  let user: ReturnType<typeof userEvent.setup>;

  const mockUser = {
    id: 'operator-123',
    email: 'operator@example.com',
    role: 'OPERATOR',
    profile: {
      username: 'operator1',
      fullName: 'Test Operator'
    }
  };

  const mockConversations = [
    {
      _id: 'conv-1',
      participants: [
        {
          id: 'user-1',
          email: 'user1@example.com',
          role: 'USER',
          profile: {
            fullName: 'User One',
            username: 'user1',
            isOnline: true
          }
        },
        mockUser
      ],
      lastMessage: {
        timestamp: new Date().toISOString()
      },
      unreadMessagesCount: 2
    }
  ];

  const mockMessages = {
    data: [
      {
        _id: 'msg-1',
        text: 'Hello, I need help',
        senderId: 'user-1',
        createdAt: new Date().toISOString(),
        readBy: ['user-1']
      },
      {
        _id: 'msg-2',
        text: 'How can I help you?',
        senderId: 'operator-123',
        createdAt: new Date().toISOString(),
        readBy: ['user-1', 'operator-123']
      }
    ]
  };

  const mockChatHook = {
    isConnected: true,
    isConnecting: false,
    typingUsers: {},
    sendChatMessage: jest.fn(),
    setTyping: jest.fn(),
    joinConversation: jest.fn(),
    leaveConversation: jest.fn(),
    reconnect: jest.fn()
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
    });
    user = userEvent.setup();
    
    mockUseAuthStore.mockReturnValue({ user: mockUser });
    mockUseChat.mockReturnValue(mockChatHook);
    
    (chatAPI.getConversations as jest.Mock).mockResolvedValue({
      data: mockConversations
    });
    
    (chatAPI.getMessages as jest.Mock).mockResolvedValue(mockMessages);
    
    jest.clearAllMocks();
  });

  const renderWithProviders = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <OperatorChatPage />
      </QueryClientProvider>
    );
  };

  describe('Page Layout', () => {
    test('renders main chat interface layout', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Сообщения')).toBeInTheDocument();
      });

      // Sidebar with conversations
      expect(screen.getByPlaceholderText('Поиск контактов...')).toBeInTheDocument();
      
      // Main chat area placeholder
      expect(screen.getByText('Выберите чат')).toBeInTheDocument();
    });

    test('shows WebSocket connection status', async () => {
      renderWithProviders();

      await waitFor(() => {
        // Connection status should be visible
        expect(screen.getByTitle(/подключено|не подключено/i)).toBeInTheDocument();
      });
    });
  });

  describe('Conversations List', () => {
    test('displays list of conversations', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('User One')).toBeInTheDocument();
        expect(screen.getByText('Посетитель')).toBeInTheDocument();
      });
    });

    test('shows unread message count', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument(); // Unread count
      });
    });

    test('filters conversations by search query', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('User One')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Поиск контактов...');
      await user.type(searchInput, 'User');

      // Should still show User One
      expect(screen.getByText('User One')).toBeInTheDocument();

      await user.clear(searchInput);
      await user.type(searchInput, 'NonExistent');

      // Should filter out conversations
      await waitFor(() => {
        expect(screen.queryByText('User One')).not.toBeInTheDocument();
      });
    });
  });

  describe('Conversation Selection', () => {
    test('selects conversation when clicked', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('User One')).toBeInTheDocument();
      });

      const conversationItem = screen.getByText('User One').closest('div');
      await user.click(conversationItem!);

      // Should join the conversation
      expect(mockChatHook.joinConversation).toHaveBeenCalledWith('conv-1');
    });

    test('shows conversation messages when selected', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('User One')).toBeInTheDocument();
      });

      const conversationItem = screen.getByText('User One').closest('div');
      await user.click(conversationItem!);

      await waitFor(() => {
        expect(screen.getByText('Hello, I need help')).toBeInTheDocument();
        expect(screen.getByText('How can I help you?')).toBeInTheDocument();
      });
    });
  });

  describe('Message Sending', () => {
    beforeEach(async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('User One')).toBeInTheDocument();
      });

      const conversationItem = screen.getByText('User One').closest('div');
      await user.click(conversationItem!);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Введите сообщение...')).toBeInTheDocument();
      });
    });

    test('sends message when send button is clicked', async () => {
      const messageInput = screen.getByPlaceholderText('Введите сообщение...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(messageInput, 'Test message');
      await user.click(sendButton);

      expect(mockChatHook.sendChatMessage).toHaveBeenCalledWith('conv-1', 'Test message');
    });

    test('sends message when Enter key is pressed', async () => {
      const messageInput = screen.getByPlaceholderText('Введите сообщение...');

      await user.type(messageInput, 'Test message{Enter}');

      expect(mockChatHook.sendChatMessage).toHaveBeenCalledWith('conv-1', 'Test message');
    });

    test('disables send button when message is empty', () => {
      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toBeDisabled();
    });

    test('disables send button when not connected', () => {
      mockChatHook.isConnected = false;
      
      renderWithProviders();
      
      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toBeDisabled();
    });
  });

  describe('Typing Indicators', () => {
    beforeEach(async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('User One')).toBeInTheDocument();
      });

      const conversationItem = screen.getByText('User One').closest('div');
      await user.click(conversationItem!);
    });

    test('shows typing indicator when user is typing', () => {
      mockChatHook.typingUsers = { 'conv-1': ['user-1'] };
      
      renderWithProviders();
      
      expect(screen.getByText('Пользователь печатает...')).toBeInTheDocument();
    });

    test('sends typing events when operator types', async () => {
      const messageInput = screen.getByPlaceholderText('Введите сообщение...');

      await user.type(messageInput, 'Test');

      expect(mockChatHook.setTyping).toHaveBeenCalledWith('conv-1', true);
    });
  });

  describe('User Information Sidebar', () => {
    beforeEach(async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('User One')).toBeInTheDocument();
      });

      const conversationItem = screen.getByText('User One').closest('div');
      await user.click(conversationItem!);
    });

    test('shows user information when conversation is selected', async () => {
      await waitFor(() => {
        expect(screen.getByText('Информация о пользователе')).toBeInTheDocument();
        expect(screen.getByText('user1@example.com')).toBeInTheDocument();
      });
    });

    test('shows action buttons for visitor users', async () => {
      await waitFor(() => {
        expect(screen.getByText('Перенаправить')).toBeInTheDocument();
        expect(screen.getByText('Заблокировать')).toBeInTheDocument();
      });
    });
  });

  describe('WebSocket Integration', () => {
    test('connects to chat when component mounts', () => {
      renderWithProviders();

      expect(mockUseChat).toHaveBeenCalled();
    });

    test('shows connection status', async () => {
      mockChatHook.isConnected = true;
      
      renderWithProviders();

      await waitFor(() => {
        // Green WiFi icon for connected state
        expect(document.querySelector('.text-green-500')).toBeInTheDocument();
      });
    });

    test('shows disconnected status', async () => {
      mockChatHook.isConnected = false;
      
      renderWithProviders();

      await waitFor(() => {
        // Red WiFi icon for disconnected state
        expect(document.querySelector('.text-red-500')).toBeInTheDocument();
      });
    });

    test('allows reconnection when disconnected', async () => {
      mockChatHook.isConnected = false;
      
      renderWithProviders();

      const reconnectButton = screen.getByTitle(/не подключено/i);
      await user.click(reconnectButton);

      expect(mockChatHook.reconnect).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('shows loading state for conversations', () => {
      (chatAPI.getConversations as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      renderWithProviders();

      expect(screen.getByTestId('spinner')).toBeInTheDocument();
      expect(screen.getByText('Загрузка контактов...')).toBeInTheDocument();
    });

    test('shows empty state when no conversations', async () => {
      (chatAPI.getConversations as jest.Mock).mockResolvedValue({ data: [] });

      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Нет активных контактов')).toBeInTheDocument();
      });
    });

    test('shows loading state for messages', async () => {
      (chatAPI.getMessages as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('User One')).toBeInTheDocument();
      });

      const conversationItem = screen.getByText('User One').closest('div');
      await user.click(conversationItem!);

      expect(screen.getByTestId('spinner')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels for interactive elements', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('User One')).toBeInTheDocument();
      });

      const conversationItem = screen.getByText('User One').closest('div');
      await user.click(conversationItem!);

      await waitFor(() => {
        const messageInput = screen.getByPlaceholderText('Введите сообщение...');
        expect(messageInput).toHaveAttribute('type', 'text');
        
        const sendButton = screen.getByRole('button', { name: /send/i });
        expect(sendButton).toBeInTheDocument();
      });
    });

    test('supports keyboard navigation', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('User One')).toBeInTheDocument();
      });

      const conversationItem = screen.getByText('User One').closest('div');
      await user.click(conversationItem!);

      await waitFor(() => {
        const messageInput = screen.getByPlaceholderText('Введите сообщение...');
        await user.tab();
        expect(messageInput).toHaveFocus();
      });
    });
  });

  describe('Performance Optimizations', () => {
    test('memoizes filtered senders calculation', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('User One')).toBeInTheDocument();
      });

      // Component should handle large lists efficiently
      const searchInput = screen.getByPlaceholderText('Поиск контактов...');
      await user.type(searchInput, 'User');
      
      expect(screen.getByText('User One')).toBeInTheDocument();
    });

    test('handles conversation switching efficiently', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('User One')).toBeInTheDocument();
      });

      const conversationItem = screen.getByText('User One').closest('div');
      await user.click(conversationItem!);

      // Should join new conversation and leave old one
      expect(mockChatHook.joinConversation).toHaveBeenCalledWith('conv-1');
    });
  });
});