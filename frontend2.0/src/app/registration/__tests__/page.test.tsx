import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RegistrationPage from '../page';
import { authAPI } from '@/core/api';

// Mock dependencies
jest.mock('next/navigation');
jest.mock('@/core/api');

const mockPush = jest.fn();

(useRouter as jest.Mock).mockReturnValue({
  push: mockPush,
});

// Mock window.alert
window.alert = jest.fn();

describe('RegistrationPage', () => {
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
        <RegistrationPage />
      </QueryClientProvider>
    );
  };

  describe('Page Rendering', () => {
    test('renders registration form elements', () => {
      renderWithProviders();

      expect(screen.getByText('Регистрация')).toBeInTheDocument();
      expect(screen.getByText('Создайте аккаунт для доступа к системе')).toBeInTheDocument();
      expect(screen.getByLabelText(/полное имя/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/имя пользователя/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText('Пароль')).toBeInTheDocument();
      expect(screen.getByLabelText(/повторите пароль/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /зарегистрироваться/i })).toBeInTheDocument();
    });

    test('renders navigation link to login', () => {
      renderWithProviders();

      expect(screen.getByText('Войти')).toBeInTheDocument();
    });

    test('shows password requirements', () => {
      renderWithProviders();

      expect(screen.getByText('Минимум 8 символов: заглавная, строчная, цифра, спецсимвол (@$!%*?&)')).toBeInTheDocument();
    });

    test('shows username requirements', () => {
      renderWithProviders();

      expect(screen.getByText('Только латинские буквы, цифры, _ и -, минимум 3 символа')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    test('validates required full name', async () => {
      renderWithProviders();

      const submitButton = screen.getByRole('button', { name: /зарегистрироваться/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Введите полное имя')).toBeInTheDocument();
      });
    });

    test('validates username format and length', async () => {
      renderWithProviders();

      const usernameInput = screen.getByLabelText(/имя пользователя/i);
      const submitButton = screen.getByRole('button', { name: /зарегистрироваться/i });

      // Test too short username
      await user.type(usernameInput, 'ab');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Имя пользователя должно содержать минимум 3 символа')).toBeInTheDocument();
      });

      // Test invalid characters
      await user.clear(usernameInput);
      await user.type(usernameInput, 'user@name');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Только латинские буквы, цифры, _ и -')).toBeInTheDocument();
      });
    });

    test('validates email format', async () => {
      renderWithProviders();

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /зарегистрироваться/i });

      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Введите корректный email')).toBeInTheDocument();
      });
    });

    test('validates password strength', async () => {
      renderWithProviders();

      const passwordInput = screen.getByLabelText('Пароль');
      const submitButton = screen.getByRole('button', { name: /зарегистрироваться/i });

      // Test short password
      await user.type(passwordInput, 'weak');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Минимум 8 символов')).toBeInTheDocument();
      });

      // Test password without required characters
      await user.clear(passwordInput);
      await user.type(passwordInput, 'onlylowercase');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/пароль должен содержать/i)).toBeInTheDocument();
      });
    });

    test('validates password confirmation', async () => {
      renderWithProviders();

      const passwordInput = screen.getByLabelText('Пароль');
      const confirmPasswordInput = screen.getByLabelText(/повторите пароль/i);
      const submitButton = screen.getByRole('button', { name: /зарегистрироваться/i });

      await user.type(passwordInput, 'ValidPass123!');
      await user.type(confirmPasswordInput, 'DifferentPass123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Пароли не совпадают')).toBeInTheDocument();
      });
    });
  });

  describe('Password Visibility Toggle', () => {
    test('toggles password visibility for password field', async () => {
      renderWithProviders();

      const passwordInput = screen.getByLabelText('Пароль');
      const toggleButtons = screen.getAllByRole('button', { name: /toggle password/i });
      const passwordToggle = toggleButtons[0];

      expect(passwordInput).toHaveAttribute('type', 'password');

      await user.click(passwordToggle);
      expect(passwordInput).toHaveAttribute('type', 'text');

      await user.click(passwordToggle);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('toggles password visibility for confirm password field', async () => {
      renderWithProviders();

      const confirmPasswordInput = screen.getByLabelText(/повторите пароль/i);
      const toggleButtons = screen.getAllByRole('button', { name: /toggle password/i });
      const confirmToggle = toggleButtons[1];

      expect(confirmPasswordInput).toHaveAttribute('type', 'password');

      await user.click(confirmToggle);
      expect(confirmPasswordInput).toHaveAttribute('type', 'text');

      await user.click(confirmToggle);
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Form Submission', () => {
    const validFormData = {
      fullName: 'John Doe',
      username: 'johndoe',
      email: 'john@example.com',
      password: 'ValidPass123!',
      passwordConfirm: 'ValidPass123!'
    };

    test('submits form with valid data', async () => {
      const mockResponse = {
        id: 'user-123',
        email: 'john@example.com',
        fullName: 'John Doe'
      };

      (authAPI.register as jest.Mock).mockResolvedValue({ data: mockResponse });

      renderWithProviders();

      const fullNameInput = screen.getByLabelText(/полное имя/i);
      const usernameInput = screen.getByLabelText(/имя пользователя/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText('Пароль');
      const confirmPasswordInput = screen.getByLabelText(/повторите пароль/i);
      const submitButton = screen.getByRole('button', { name: /зарегистрироваться/i });

      await user.type(fullNameInput, validFormData.fullName);
      await user.type(usernameInput, validFormData.username);
      await user.type(emailInput, validFormData.email);
      await user.type(passwordInput, validFormData.password);
      await user.type(confirmPasswordInput, validFormData.passwordConfirm);
      await user.click(submitButton);

      await waitFor(() => {
        expect(authAPI.register).toHaveBeenCalledWith({
          fullName: validFormData.fullName,
          username: validFormData.username,
          email: validFormData.email,
          password: validFormData.password
        });
      });
    });

    test('shows loading state during submission', async () => {
      (authAPI.register as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );

      renderWithProviders();

      await fillValidForm();

      const submitButton = screen.getByRole('button', { name: /регистрация.../i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    test('shows success message and redirects after successful registration', async () => {
      const mockResponse = {
        id: 'user-123',
        email: 'john@example.com'
      };

      (authAPI.register as jest.Mock).mockResolvedValue({ data: mockResponse });

      renderWithProviders();

      await fillValidForm();

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Регистрация успешна! Проверьте email для подтверждения аккаунта.');
        expect(mockPush).toHaveBeenCalledWith('/chat');
      });
    });

    async function fillValidForm() {
      const fullNameInput = screen.getByLabelText(/полное имя/i);
      const usernameInput = screen.getByLabelText(/имя пользователя/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText('Пароль');
      const confirmPasswordInput = screen.getByLabelText(/повторите пароль/i);
      const submitButton = screen.getByRole('button', { name: /зарегистрироваться/i });

      await user.type(fullNameInput, validFormData.fullName);
      await user.type(usernameInput, validFormData.username);
      await user.type(emailInput, validFormData.email);
      await user.type(passwordInput, validFormData.password);
      await user.type(confirmPasswordInput, validFormData.passwordConfirm);
      await user.click(submitButton);
    }
  });

  describe('Error Handling', () => {
    test('shows server validation errors', async () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            message: ['Email уже используется', 'Имя пользователя занято']
          }
        }
      };

      (authAPI.register as jest.Mock).mockRejectedValue(mockError);

      renderWithProviders();

      await fillValidForm();

      await waitFor(() => {
        expect(screen.getByText('Email уже используется\nИмя пользователя занято')).toBeInTheDocument();
      });
    });

    test('shows single error message', async () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            message: 'Email уже используется'
          }
        }
      };

      (authAPI.register as jest.Mock).mockRejectedValue(mockError);

      renderWithProviders();

      await fillValidForm();

      await waitFor(() => {
        expect(screen.getByText('Email уже используется')).toBeInTheDocument();
      });
    });

    test('shows generic error for network issues', async () => {
      (authAPI.register as jest.Mock).mockRejectedValue(new Error('Network error'));

      renderWithProviders();

      await fillValidForm();

      await waitFor(() => {
        expect(screen.getByText(/не удалось подключиться к серверу/i)).toBeInTheDocument();
      });
    });

    async function fillValidForm() {
      const fullNameInput = screen.getByLabelText(/полное имя/i);
      const usernameInput = screen.getByLabelText(/имя пользователя/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText('Пароль');
      const confirmPasswordInput = screen.getByLabelText(/повторите пароль/i);
      const submitButton = screen.getByRole('button', { name: /зарегистрироваться/i });

      await user.type(fullNameInput, 'John Doe');
      await user.type(usernameInput, 'johndoe');
      await user.type(emailInput, 'john@example.com');
      await user.type(passwordInput, 'ValidPass123!');
      await user.type(confirmPasswordInput, 'ValidPass123!');
      await user.click(submitButton);
    }
  });

  describe('Accessibility', () => {
    test('has proper form labels', () => {
      renderWithProviders();

      expect(screen.getByLabelText(/полное имя/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/имя пользователя/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText('Пароль')).toBeInTheDocument();
      expect(screen.getByLabelText(/повторите пароль/i)).toBeInTheDocument();
    });

    test('has proper input types', () => {
      renderWithProviders();

      expect(screen.getByLabelText(/полное имя/i)).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText(/имя пользователя/i)).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText(/email/i)).toHaveAttribute('type', 'email');
      expect(screen.getByLabelText('Пароль')).toHaveAttribute('type', 'password');
      expect(screen.getByLabelText(/повторите пароль/i)).toHaveAttribute('type', 'password');
    });

    test('shows error messages with proper styling', async () => {
      renderWithProviders();

      const submitButton = screen.getByRole('button', { name: /зарегистрироваться/i });
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessages = screen.getAllByText(/введите/i);
        errorMessages.forEach(message => {
          expect(message).toHaveClass('text-red-600');
        });
      });
    });
  });

  describe('Hydration Warning Suppression', () => {
    test('has suppressHydrationWarning on form and inputs', () => {
      renderWithProviders();

      const form = screen.getByRole('form');
      expect(form).toHaveAttribute('suppressHydrationWarning', 'true');

      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        expect(input).toHaveAttribute('suppressHydrationWarning', 'true');
      });
    });
  });

  describe('Navigation', () => {
    test('has correct link to login page', () => {
      renderWithProviders();

      const loginLink = screen.getByText('Войти');
      expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
    });
  });

  describe('User Experience', () => {
    test('allows form submission with Enter key', async () => {
      const mockResponse = { id: 'user-123' };
      (authAPI.register as jest.Mock).mockResolvedValue({ data: mockResponse });

      renderWithProviders();

      const fullNameInput = screen.getByLabelText(/полное имя/i);
      await user.type(fullNameInput, 'John Doe');
      
      const usernameInput = screen.getByLabelText(/имя пользователя/i);
      await user.type(usernameInput, 'johndoe');
      
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'john@example.com');
      
      const passwordInput = screen.getByLabelText('Пароль');
      await user.type(passwordInput, 'ValidPass123!');
      
      const confirmPasswordInput = screen.getByLabelText(/повторите пароль/i);
      await user.type(confirmPasswordInput, 'ValidPass123!{Enter}');

      await waitFor(() => {
        expect(authAPI.register).toHaveBeenCalled();
      });
    });

    test('provides helpful placeholder text', () => {
      renderWithProviders();

      expect(screen.getByPlaceholderText('Андрей Иванов')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('andrey_123')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('user@example.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('MyPassword123!')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Повторите пароль')).toBeInTheDocument();
    });
  });
});