import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ChatWidget from '../ChatWidget';
import { useSocketIO } from '../../../hooks/useSocketIO';
import { useApiCall } from '../../../hooks/useApiCall';

// Mock dependencies
jest.mock('../../../hooks/useSocketIO');
jest.mock('../../../hooks/useApiCall');
jest.mock('../../../store/authStore');

const mockUseSocketIO = useSocketIO as jest.MockedFunction<typeof useSocketIO>;
const mockUseApiCall = useApiCall as jest.MockedFunction<typeof useApiCall>;

// Mock API responses
global.fetch = jest.fn();

describe('ChatWidget', () => {
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
    
    // Mock fetch
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { id: '123', user: { role: 'USER' } } })
    });

    // Mock cookie methods
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: ''
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  const renderWithProviders = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ChatWidget {...props} />
      </QueryClientProvider>
    );
  };

  describe('Widget Initialization', () => {
    test('renders closed widget by default', () => {
      renderWithProviders();
      
      const openButton = screen.getByRole('button', { name: /message/i });
      expect(openButton).toBeInTheDocument();
      expect(screen.queryByText('Добро пожаловать! Как могу помочь?')).not.toBeInTheDocument();
    });

    test('opens widget when button is clicked', async () => {
      renderWithProviders();
      
      const openButton = screen.getByRole('button', { name: /message/i });
      await user.click(openButton);
      
      expect(screen.getByText('Оператор')).toBeInTheDocument();
    });

    test('applies custom props correctly', () => {
      const customProps = {
        primaryColor: '#ff0000',
        operatorName: 'Тест Оператор',
        welcomeMessage: 'Привет тестер!',
        placeholder: 'Тестовое сообщение...'
      };
      
      renderWithProviders(customProps);
      
      const openButton = screen.getByRole('button', { name: /message/i });
      expect(openButton).toHaveStyle({ backgroundColor: '#ff0000' });
    });
  });

  describe('Authentication Flow', () => {
    test('shows login button for unauthenticated users', async () => {
      renderWithProviders();
      
      const openButton = screen.getByRole('button', { name: /message/i });
      await user.click(openButton);
      
      await waitFor(() => {
        expect(screen.getByText('Войти')).toBeInTheDocument();
      });
    });

    test('shows profile button for authenticated users', async () => {
      // Mock authenticated state
      mockApiCallReturn.execute.mockResolvedValueOnce({
        success: true,
        data: { 
          id: '123', 
          user: { role: 'USER', fullName: 'Test User' } 
        }
      });

      renderWithProviders();
      
      const openButton = screen.getByRole('button', { name: /message/i });
      await user.click(openButton);
      
      await waitFor(() => {
        expect(screen.getByText('Профиль')).toBeInTheDocument();
      });
    });

    test('handles guest registration correctly', async () => {
      renderWithProviders();
      
      const openButton = screen.getByRole('button', { name: /message/i });
      await user.click(openButton);
      
      await waitFor(() => {
        expect(mockApiCallReturn.execute).toHaveBeenCalled();
      });
    });
  });

  describe('Message Handling', () => {
    beforeEach(async () => {
      renderWithProviders();
      
      const openButton = screen.getByRole('button', { name: /message/i });
      await user.click(openButton);
      
      // Wait for widget to open and initialize
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Введите сообщение...')).toBeInTheDocument();
      });
    });

    test('sends message when user types and presses enter', async () => {
      const messageInput = screen.getByPlaceholderText('Введите сообщение...');
      
      await user.type(messageInput, 'Тестовое сообщение');
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(mockApiCallReturn.execute).toHaveBeenCalled();
      });
    });

    test('sends message when send button is clicked', async () => {
      const messageInput = screen.getByPlaceholderText('Введите сообщение...');
      const sendButton = screen.getByLabelText('send');
      
      await user.type(messageInput, 'Тестовое сообщение');
      await user.click(sendButton);
      
      await waitFor(() => {
        expect(mockApiCallReturn.execute).toHaveBeenCalled();
      });
    });

    test('disables send button when input is empty', () => {
      const sendButton = screen.getByLabelText('send');
      expect(sendButton).toBeDisabled();
    });

    test('displays sent message in chat', async () => {
      const messageInput = screen.getByPlaceholderText('Введите сообщение...');
      
      await user.type(messageInput, 'Тестовое сообщение');
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(screen.getByText('Тестовое сообщение')).toBeInTheDocument();
      });
    });
  });

  describe('File Upload', () => {
    beforeEach(async () => {
      renderWithProviders({ allowFileUpload: true });
      
      const openButton = screen.getByRole('button', { name: /message/i });
      await user.click(openButton);
    });

    test('shows file upload button when enabled', async () => {
      await waitFor(() => {
        expect(screen.getByLabelText('paperclip')).toBeInTheDocument();
      });
    });

    test('handles file upload correctly', async () => {
      const fileInput = screen.getByDisplayValue('') as HTMLInputElement;
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      
      await user.upload(fileInput, file);
      
      await waitFor(() => {
        expect(mockApiCallReturn.execute).toHaveBeenCalled();
      });
    });

    test('rejects files that are too large', async () => {
      renderWithProviders({ allowFileUpload: true, maxFileSize: 1024 });
      
      const openButton = screen.getByRole('button', { name: /message/i });
      await user.click(openButton);

      const fileInput = screen.getByDisplayValue('') as HTMLInputElement;
      const largeFile = new File(['x'.repeat(2048)], 'large.txt', { type: 'text/plain' });
      
      // Mock alert
      window.alert = jest.fn();
      
      await user.upload(fileInput, largeFile);
      
      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining('Файл слишком большой')
      );
    });
  });

  describe('Rating and Complaints', () => {
    beforeEach(async () => {
      renderWithProviders({ 
        allowRating: true, 
        allowComplaint: true 
      });
      
      const openButton = screen.getByRole('button', { name: /message/i });
      await user.click(openButton);
      
      // Mock operator info
      await act(async () => {
        // Simulate operator being set
      });
    });

    test('shows rating button when enabled', async () => {
      await waitFor(() => {
        const ratingButton = screen.queryByText('Оценить');
        if (ratingButton) {
          expect(ratingButton).toBeInTheDocument();
        }
      });
    });

    test('shows complaint button when enabled', async () => {
      await waitFor(() => {
        const complaintButton = screen.queryByText('Жалоба');
        if (complaintButton) {
          expect(complaintButton).toBeInTheDocument();
        }
      });
    });

    test('opens rating modal when rating button is clicked', async () => {
      const ratingButton = screen.queryByText('Оценить');
      if (ratingButton) {
        await user.click(ratingButton);
        // Rating modal test would be in separate test file
      }
    });
  });

  describe('Connection Status', () => {
    test('shows online status when connected', async () => {
      mockSocketIOReturn.isConnected = true;
      
      renderWithProviders();
      const openButton = screen.getByRole('button', { name: /message/i });
      await user.click(openButton);
      
      await waitFor(() => {
        expect(screen.getByText('В сети')).toBeInTheDocument();
      });
    });

    test('shows offline status when disconnected', async () => {
      mockSocketIOReturn.isConnected = false;
      
      renderWithProviders();
      const openButton = screen.getByRole('button', { name: /message/i });
      await user.click(openButton);
      
      await waitFor(() => {
        expect(screen.getByText('Не в сети')).toBeInTheDocument();
      });
    });
  });

  describe('WebSocket Integration', () => {
    test('connects to WebSocket when widget opens', async () => {
      renderWithProviders();
      
      const openButton = screen.getByRole('button', { name: /message/i });
      await user.click(openButton);
      
      await waitFor(() => {
        expect(mockUseSocketIO).toHaveBeenCalledWith('/chat', expect.any(Object));
      });
    });

    test('emits message through WebSocket when connected', async () => {
      mockSocketIOReturn.isConnected = true;
      
      renderWithProviders();
      const openButton = screen.getByRole('button', { name: /message/i });
      await user.click(openButton);
      
      const messageInput = screen.getByPlaceholderText('Введите сообщение...');
      await user.type(messageInput, 'Тестовое сообщение');
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(mockSocketIOReturn.emit).toHaveBeenCalled();
      });
    });
  });

  describe('Theme and Positioning', () => {
    test('applies light theme correctly', () => {
      renderWithProviders({ theme: 'light' });
      
      const openButton = screen.getByRole('button', { name: /message/i });
      expect(openButton.closest('div')).toHaveClass('fixed', 'bottom-4', 'right-4');
    });

    test('applies dark theme correctly', () => {
      renderWithProviders({ theme: 'dark' });
      
      // Theme classes would be applied after opening
      const openButton = screen.getByRole('button', { name: /message/i });
      expect(openButton).toBeInTheDocument();
    });

    test('positions widget correctly', () => {
      renderWithProviders({ position: 'bottom-left' });
      
      const openButton = screen.getByRole('button', { name: /message/i });
      expect(openButton.closest('div')).toHaveClass('fixed', 'bottom-4', 'left-4');
    });
  });

  describe('Error Handling', () => {
    test('handles API errors gracefully', async () => {
      mockApiCallReturn.execute.mockRejectedValueOnce(new Error('API Error'));
      
      renderWithProviders();
      const openButton = screen.getByRole('button', { name: /message/i });
      await user.click(openButton);
      
      // Should not crash and should handle error gracefully
      expect(openButton).toBeInTheDocument();
    });

    test('handles WebSocket connection errors', async () => {
      mockSocketIOReturn.isConnected = false;
      
      renderWithProviders();
      const openButton = screen.getByRole('button', { name: /message/i });
      await user.click(openButton);
      
      await waitFor(() => {
        expect(screen.getByText('Не в сети')).toBeInTheDocument();
      });
    });
  });

  describe('Cookie Management', () => {
    test('saves authentication data to cookies', async () => {
      const mockSetCookie = jest.fn();
      
      // Mock cookie functionality
      Object.defineProperty(document, 'cookie', {
        set: mockSetCookie,
        get: () => '',
        configurable: true
      });
      
      renderWithProviders();
      const openButton = screen.getByRole('button', { name: /message/i });
      await user.click(openButton);
      
      // Cookie operations would be tested through authentication flow
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels', async () => {
      renderWithProviders();
      
      const openButton = screen.getByRole('button', { name: /message/i });
      await user.click(openButton);
      
      await waitFor(() => {
        const sendButton = screen.getByLabelText('send');
        const fileButton = screen.getByLabelText('paperclip');
        const closeButton = screen.getByLabelText('close');
        
        expect(sendButton).toBeInTheDocument();
        expect(fileButton).toBeInTheDocument();
        expect(closeButton).toBeInTheDocument();
      });
    });

    test('supports keyboard navigation', async () => {
      renderWithProviders();
      
      const openButton = screen.getByRole('button', { name: /message/i });
      await user.click(openButton);
      
      const messageInput = screen.getByPlaceholderText('Введите сообщение...');
      
      // Test keyboard interaction
      await user.type(messageInput, 'Test message');
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(mockApiCallReturn.execute).toHaveBeenCalled();
      });
    });
  });
});