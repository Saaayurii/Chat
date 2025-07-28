import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginPage from '../page';
import { useAuthStore } from '@/store/authStore';
import { authAPI } from '@/core/api';

// Mock dependencies
jest.mock('next/navigation');
jest.mock('@/store/authStore');
jest.mock('@/core/api');

const mockPush = jest.fn();
const mockSetAuth = jest.fn();

(useRouter as jest.Mock).mockReturnValue({
  push: mockPush,
});

(useAuthStore as unknown as jest.Mock).mockReturnValue({
  setAuth: mockSetAuth,
});

describe('LoginPage', () => {
  let queryClient: QueryClient;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
    });
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  const renderWithProviders = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>
    );
  };

  describe('Page Rendering', () => {
    test('renders login form elements', () => {
      renderWithProviders();

      expect(screen.getByText('Вход в систему')).toBeInTheDocument();
      expect(screen.getByText('Введите ваш email для входа в аккаунт')).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/пароль/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument();
    });

    test('renders navigation links', () => {
      renderWithProviders();

      expect(screen.getByText('Забыли пароль?')).toBeInTheDocument();
      expect(screen.getByText('Регистрация')).toBeInTheDocument();
    });

    test('has proper form structure', () => {
      renderWithProviders();

      const form = screen.getByRole('form');
      expect(form).toHaveAttribute('suppressHydrationWarning', 'true');
    });
  });

  describe('Form Validation', () => {
    test('validates email format', async () => {
      renderWithProviders();

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /войти/i });

      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Введите корректный email')).toBeInTheDocument();
      });
    });

    test('validates required password', async () => {
      renderWithProviders();

      const passwordInput = screen.getByLabelText(/пароль/i);
      const submitButton = screen.getByRole('button', { name: /войти/i });

      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Введите пароль')).toBeInTheDocument();
      });
    });

    test('enables submit button with valid inputs', async () => {
      renderWithProviders();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/пароль/i);
      const submitButton = screen.getByRole('button', { name: /войти/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Password Visibility Toggle', () => {
    test('toggles password visibility', async () => {
      renderWithProviders();

      const passwordInput = screen.getByLabelText(/пароль/i);
      const toggleButton = screen.getByRole('button', { name: /toggle password/i });

      expect(passwordInput).toHaveAttribute('type', 'password');

      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');

      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('shows correct icon for password visibility state', async () => {
      renderWithProviders();

      const toggleButton = screen.getByRole('button', { name: /toggle password/i });

      expect(toggleButton.querySelector('[data-icon="eye"]')).toBeInTheDocument();

      await user.click(toggleButton);
      expect(toggleButton.querySelector('[data-icon="eye-off"]')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    test('submits form with valid credentials', async () => {
      const mockResponse = {
        access_token: 'test-token',
        user: {
          _id: 'user-123',
          email: 'test@example.com',
          role: 'USER',
          isActivated: true,
          profile: {
            username: 'testuser'
          }
        }
      };

      (authAPI.login as jest.Mock).mockResolvedValue({ data: mockResponse });

      renderWithProviders();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/пароль/i);
      const submitButton = screen.getByRole('button', { name: /войти/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(authAPI.login).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        });
      });
    });

    test('shows loading state during submission', async () => {
      (authAPI.login as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );

      renderWithProviders();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/пароль/i);
      const submitButton = screen.getByRole('button', { name: /войти/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      expect(screen.getByText('Вход...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Authentication Success', () => {
    test('redirects admin users to admin dashboard', async () => {
      const mockResponse = {
        access_token: 'test-token',
        user: {
          _id: 'admin-123',
          email: 'admin@example.com',
          role: 'ADMIN',
          isActivated: true
        }
      };

      (authAPI.login as jest.Mock).mockResolvedValue({ data: mockResponse });

      renderWithProviders();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/пароль/i);
      const submitButton = screen.getByRole('button', { name: /войти/i });

      await user.type(emailInput, 'admin@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSetAuth).toHaveBeenCalledWith('test-token', expect.objectContaining({
          role: 'ADMIN'
        }));
        expect(mockPush).toHaveBeenCalledWith('/admin/statistics');
      });
    });

    test('redirects operator users to admin dashboard', async () => {
      const mockResponse = {
        access_token: 'test-token',
        user: {
          _id: 'operator-123',
          email: 'operator@example.com',
          role: 'OPERATOR',
          isActivated: true
        }
      };

      (authAPI.login as jest.Mock).mockResolvedValue({ data: mockResponse });

      renderWithProviders();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/пароль/i);
      const submitButton = screen.getByRole('button', { name: /войти/i });

      await user.type(emailInput, 'operator@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSetAuth).toHaveBeenCalledWith('test-token', expect.objectContaining({
          role: 'OPERATOR'
        }));
        expect(mockPush).toHaveBeenCalledWith('/admin/statistics');
      });
    });

    test('redirects regular users to chat page', async () => {
      const mockResponse = {
        access_token: 'test-token',
        user: {
          _id: 'user-123',
          email: 'user@example.com',
          role: 'USER',
          isActivated: true
        }
      };

      (authAPI.login as jest.Mock).mockResolvedValue({ data: mockResponse });

      renderWithProviders();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/пароль/i);
      const submitButton = screen.getByRole('button', { name: /войти/i });

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSetAuth).toHaveBeenCalledWith('test-token', expect.objectContaining({
          role: 'USER'
        }));
        expect(mockPush).toHaveBeenCalledWith('/chat');
      });
    });
  });

  describe('Error Handling', () => {
    test('shows error message for invalid credentials', async () => {
      const mockError = {
        response: {
          status: 401,
          data: {
            message: 'Неверный email или пароль'
          }
        }
      };

      (authAPI.login as jest.Mock).mockRejectedValue(mockError);

      renderWithProviders();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/пароль/i);
      const submitButton = screen.getByRole('button', { name: /войти/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Неверный email или пароль')).toBeInTheDocument();
      });
    });

    test('shows generic error message for network errors', async () => {
      (authAPI.login as jest.Mock).mockRejectedValue(new Error('Network error'));

      renderWithProviders();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/пароль/i);
      const submitButton = screen.getByRole('button', { name: /войти/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/не удалось подключиться к серверу/i)).toBeInTheDocument();
      });
    });

    test('handles missing access token', async () => {
      const mockResponse = {
        user: {
          _id: 'user-123',
          email: 'test@example.com',
          role: 'USER'
        }
        // Missing access_token
      };

      (authAPI.login as jest.Mock).mockResolvedValue({ data: mockResponse });

      renderWithProviders();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/пароль/i);
      const submitButton = screen.getByRole('button', { name: /войти/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Не удалось получить токен доступа.')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper form labels', () => {
      renderWithProviders();

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/пароль/i)).toBeInTheDocument();
    });

    test('has proper ARIA attributes', () => {
      renderWithProviders();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/пароль/i);

      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('shows error messages with proper ARIA attributes', async () => {
      renderWithProviders();

      const submitButton = screen.getByRole('button', { name: /войти/i });
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText('Введите корректный email');
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });
  });

  describe('Hydration Warning Suppression', () => {
    test('has suppressHydrationWarning on form', () => {
      renderWithProviders();

      const form = screen.getByRole('form');
      expect(form).toHaveAttribute('suppressHydrationWarning', 'true');
    });

    test('has suppressHydrationWarning on inputs', () => {
      renderWithProviders();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/pароль/i);

      expect(emailInput).toHaveAttribute('suppressHydrationWarning', 'true');
      expect(passwordInput).toHaveAttribute('suppressHydrationWarning', 'true');
    });
  });

  describe('Navigation Links', () => {
    test('has correct link to registration page', () => {
      renderWithProviders();

      const registrationLink = screen.getByText('Регистрация');
      expect(registrationLink.closest('a')).toHaveAttribute('href', '/registration');
    });

    test('has correct link to password reset page', () => {
      renderWithProviders();

      const resetLink = screen.getByText('Забыли пароль?');
      expect(resetLink.closest('a')).toHaveAttribute('href', '/reset');
    });
  });

  describe('User Experience', () => {
    test('allows form submission with Enter key', async () => {
      const mockResponse = {
        access_token: 'test-token',
        user: {
          _id: 'user-123',
          email: 'test@example.com',
          role: 'USER'
        }
      };

      (authAPI.login as jest.Mock).mockResolvedValue({ data: mockResponse });

      renderWithProviders();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/пароль/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(authAPI.login).toHaveBeenCalled();
      });
    });

    test('focuses on email input by default', () => {
      renderWithProviders();

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveFocus();
    });
  });
});