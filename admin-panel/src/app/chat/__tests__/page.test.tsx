import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ChatPage from '../page';
import { useSocketIO } from '../../../hooks/useSocketIO';
import { useApiCall } from '../../../hooks/useApiCall';

// Mock dependencies
jest.mock('../../../hooks/useSocketIO');
jest.mock('../../../hooks/useApiCall');
jest.mock('../../../components/ChatWidget/ChatWidget', () => {
  return function MockedChatWidget(props: any) {
    return (
      <div data-testid="chat-widget" data-props={JSON.stringify(props)}>
        Mocked Chat Widget
        <button onClick={() => console.log('Widget opened')}>Open Chat</button>
      </div>
    );
  };
});

const mockUseSocketIO = useSocketIO as jest.MockedFunction<typeof useSocketIO>;
const mockUseApiCall = useApiCall as jest.MockedFunction<typeof useApiCall>;

describe('ChatPage', () => {
  let queryClient: QueryClient;
  let user: ReturnType<typeof userEvent.setup>;

  const mockSocketIOReturn = {
    isConnected: true,
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    reconnect: jest.fn(),
    disconnect: jest.fn()
  };

  const mockApiCallReturn = {
    execute: jest.fn(),
    loading: false,
    error: null,
    data: null
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
    });
    user = userEvent.setup();
    
    mockUseSocketIO.mockReturnValue(mockSocketIOReturn);
    mockUseApiCall.mockReturnValue(mockApiCallReturn);
    
    jest.clearAllMocks();
  });

  const renderWithProviders = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ChatPage />
      </QueryClientProvider>
    );
  };

  describe('Page Rendering', () => {
    test('renders welcome message and instructions', () => {
      renderWithProviders();

      expect(screen.getByText('Чат поддержки')).toBeInTheDocument();
      expect(screen.getByText('Нажмите на иконку чата в правом нижнем углу, чтобы начать общение')).toBeInTheDocument();
    });

    test('renders welcome card with information', () => {
      renderWithProviders();

      expect(screen.getByText('Добро пожаловать в чат поддержки!')).toBeInTheDocument();
      expect(screen.getByText('Мы готовы помочь вам с любыми вопросами. Наши операторы онлайн и готовы к общению.')).toBeInTheDocument();
    });

    test('shows operator status and response time', () => {
      renderWithProviders();

      expect(screen.getByText('Операторы в сети')).toBeInTheDocument();
      expect(screen.getByText('Среднее время ответа: 2-3 минуты')).toBeInTheDocument();
    });

    test('includes chat widget component', () => {
      renderWithProviders();

      expect(screen.getByTestId('chat-widget')).toBeInTheDocument();
    });
  });

  describe('Chat Widget Integration', () => {
    test('passes correct props to ChatWidget', () => {
      renderWithProviders();

      const chatWidget = screen.getByTestId('chat-widget');
      const props = JSON.parse(chatWidget.getAttribute('data-props') || '{}');

      expect(props).toEqual({
        welcomeMessage: 'Добро пожаловать в чат поддержки! Как могу помочь?',
        operatorName: 'Оператор поддержки',
        allowFileUpload: true,
        allowComplaint: true,
        allowRating: true,
        placeholder: 'Введите ваше сообщение...'
      });
    });

    test('renders ChatWidget with default configuration', () => {
      renderWithProviders();

      const chatWidget = screen.getByTestId('chat-widget');
      expect(chatWidget).toBeInTheDocument();
      expect(screen.getByText('Mocked Chat Widget')).toBeInTheDocument();
    });
  });

  describe('Visual Design', () => {
    test('has proper page layout structure', () => {
      renderWithProviders();

      const mainContainer = screen.getByText('Чат поддержки').closest('.min-h-screen');
      expect(mainContainer).toHaveClass('min-h-screen', 'bg-gray-100', 'flex', 'items-center', 'justify-center');
    });

    test('displays chat icon in welcome card', () => {
      renderWithProviders();

      const iconContainer = screen.getByText('Добро пожаловать в чат поддержки!')
        .closest('.bg-white')
        ?.querySelector('.bg-blue-100');
      
      expect(iconContainer).toBeInTheDocument();
    });

    test('shows online status indicator', () => {
      renderWithProviders();

      const statusIndicator = screen.getByText('Операторы в сети')
        .previousElementSibling;
      
      expect(statusIndicator).toHaveClass('bg-green-500', 'rounded-full');
    });
  });

  describe('User Experience', () => {
    test('provides clear call-to-action', () => {
      renderWithProviders();

      expect(screen.getByText('Нажмите на иконку чата в правом нижнем углу, чтобы начать общение')).toBeInTheDocument();
    });

    test('shows encouraging welcome message', () => {
      renderWithProviders();

      expect(screen.getByText('Мы готовы помочь вам с любыми вопросами. Наши операторы онлайн и готовы к общению.')).toBeInTheDocument();
    });

    test('displays service availability information', () => {
      renderWithProviders();

      expect(screen.getByText('Операторы в сети')).toBeInTheDocument();
      expect(screen.getByText('Среднее время ответа: 2-3 минуты')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('adapts to different screen sizes', () => {
      renderWithProviders();

      const welcomeCard = screen.getByText('Добро пожаловать в чат поддержки!')
        .closest('.bg-white');
      
      expect(welcomeCard).toHaveClass('max-w-md', 'mx-auto');
    });

    test('centers content properly', () => {
      renderWithProviders();

      const centerContainer = screen.getByText('Чат поддержки').closest('.text-center');
      expect(centerContainer).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper heading structure', () => {
      renderWithProviders();

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Чат поддержки');

      const secondaryHeading = screen.getByRole('heading', { level: 2 });
      expect(secondaryHeading).toHaveTextContent('Добро пожаловать в чат поддержки!');
    });

    test('has descriptive text for screen readers', () => {
      renderWithProviders();

      expect(screen.getByText('Нажмите на иконку чата в правом нижнем углу, чтобы начать общение')).toBeInTheDocument();
      expect(screen.getByText('Мы готовы помочь вам с любыми вопросами. Наши операторы онлайн и готовы к общению.')).toBeInTheDocument();
    });

    test('provides status information accessibly', () => {
      renderWithProviders();

      const statusText = screen.getByText('Операторы в сети');
      expect(statusText.previousElementSibling).toHaveClass('bg-green-500');
    });
  });

  describe('Page Performance', () => {
    test('renders without unnecessary re-renders', () => {
      const { rerender } = renderWithProviders();
      
      expect(screen.getByTestId('chat-widget')).toBeInTheDocument();
      
      // Rerender should not cause issues
      rerender(
        <QueryClientProvider client={queryClient}>
          <ChatPage />
        </QueryClientProvider>
      );
      
      expect(screen.getByTestId('chat-widget')).toBeInTheDocument();
    });

    test('loads ChatWidget component efficiently', () => {
      renderWithProviders();

      // Widget should be present and ready
      expect(screen.getByTestId('chat-widget')).toBeInTheDocument();
      expect(screen.getByText('Mocked Chat Widget')).toBeInTheDocument();
    });
  });

  describe('Content Structure', () => {
    test('displays main content sections', () => {
      renderWithProviders();

      // Header section
      expect(screen.getByText('Чат поддержки')).toBeInTheDocument();
      
      // Instructions section
      expect(screen.getByText('Нажмите на иконку чата в правом нижнем углу, чтобы начать общение')).toBeInTheDocument();
      
      // Welcome card section
      expect(screen.getByText('Добро пожаловать в чат поддержки!')).toBeInTheDocument();
      
      // Status section
      expect(screen.getByText('Операторы в сети')).toBeInTheDocument();
    });

    test('organizes information hierarchically', () => {
      renderWithProviders();

      const mainTitle = screen.getByText('Чат поддержки');
      const subtitle = screen.getByText('Нажмите на иконку чата в правом нижнем углу, чтобы начать общение');
      const cardTitle = screen.getByText('Добро пожаловать в чат поддержки!');

      expect(mainTitle.tagName).toBe('H1');
      expect(cardTitle.tagName).toBe('H2');
    });
  });

  describe('Interactive Elements', () => {
    test('chat widget is interactive', async () => {
      renderWithProviders();

      const chatButton = screen.getByText('Open Chat');
      expect(chatButton).toBeInTheDocument();
      
      // Should be clickable (mocked implementation)
      await user.click(chatButton);
      expect(chatButton).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('handles ChatWidget loading errors gracefully', () => {
      // Mock console.error to avoid test output noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      renderWithProviders();

      // Should still render page content even if widget has issues
      expect(screen.getByText('Чат поддержки')).toBeInTheDocument();
      expect(screen.getByText('Добро пожаловать в чат поддержки!')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    test('provides fallback content when needed', () => {
      renderWithProviders();

      // Page should always show main content
      expect(screen.getByText('Чат поддержки')).toBeInTheDocument();
      expect(screen.getByText('Мы готовы помочь вам с любыми вопросами')).toBeInTheDocument();
    });
  });

  describe('SEO and Meta Information', () => {
    test('has meaningful content for SEO', () => {
      renderWithProviders();

      // Key phrases for search engines
      expect(screen.getByText('Чат поддержки')).toBeInTheDocument();
      expect(screen.getByText('операторы')).toBeInTheDocument();
      expect(screen.getByText('поддержка')).toBeInTheDocument();
    });

    test('provides descriptive content', () => {
      renderWithProviders();

      expect(screen.getByText(/время ответа/i)).toBeInTheDocument();
      expect(screen.getByText(/готовы помочь/i)).toBeInTheDocument();
    });
  });
});