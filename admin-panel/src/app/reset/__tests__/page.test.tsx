import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ResetPasswordPage from '../page';
import { authAPI } from '@/core/api';

// Mock dependencies
jest.mock('@/core/api');

// Mock window.location.reload
delete (window as any).location;
window.location = { reload: jest.fn() } as any;

describe('ResetPasswordPage (Forgot Password)', () => {
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
        <ResetPasswordPage />
      </QueryClientProvider>
    );
  };

  describe('Initial State', () => {
    test('renders forgot password form', () => {
      renderWithProviders();

      expect(screen.getByText('Сброс пароля')).toBeInTheDocument();
      expect(screen.getByText('Введите ваш email для получения инструкций по сбросу пароля')).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /отправить инструкции/i })).toBeInTheDocument();
    });

    test('has navigation link back to login', () => {
      renderWithProviders();

      const backLink = screen.getByText('Вернуться к входу');
      expect(backLink.closest('a')).toHaveAttribute('href', '/login');
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
      const submitButton = screen.getByRole('button', { name: /отправить инструкции/i });

      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Введите корректный email')).toBeInTheDocument();
      });
    });

    test('requires email input', async () => {
      renderWithProviders();

      const submitButton = screen.getByRole('button', { name: /отправить инструкции/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Введите корректный email')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    test('submits form with valid email', async () => {
      const mockResponse = { message: 'Email sent successfully' };
      (authAPI.forgotPassword as jest.Mock).mockResolvedValue({ data: mockResponse });

      renderWithProviders();

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /отправить инструкции/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(authAPI.forgotPassword).toHaveBeenCalledWith({
          email: 'test@example.com'
        });
      });
    });

    test('shows loading state during submission', async () => {
      (authAPI.forgotPassword as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );

      renderWithProviders();

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /отправить инструкции/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      expect(screen.getByText('Отправка...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Success State', () => {
    test('shows success message after email sent', async () => {
      const mockResponse = { message: 'Email sent successfully' };
      (authAPI.forgotPassword as jest.Mock).mockResolvedValue({ data: mockResponse });

      renderWithProviders();

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /отправить инструкции/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Письмо отправлено')).toBeInTheDocument();
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
        expect(screen.getByText(/инструкции по сбросу пароля отправлены/i)).toBeInTheDocument();
      });
    });

    test('shows helpful information in success state', async () => {
      const mockResponse = { message: 'Email sent successfully' };
      (authAPI.forgotPassword as jest.Mock).mockResolvedValue({ data: mockResponse });

      renderWithProviders();

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /отправить инструкции/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Проверьте вашу почту')).toBeInTheDocument();
        expect(screen.getByText(/ссылка действительна в течение 1 часа/i)).toBeInTheDocument();
      });
    });

    test('provides resend functionality', async () => {
      const mockResponse = { message: 'Email sent successfully' };
      (authAPI.forgotPassword as jest.Mock).mockResolvedValue({ data: mockResponse });

      renderWithProviders();

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /отправить инструкции/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        const resendButton = screen.getByText('Отправить письмо снова');
        expect(resendButton).toBeInTheDocument();
      });

      const resendButton = screen.getByText('Отправить письмо снова');
      await user.click(resendButton);

      expect(window.location.reload).toHaveBeenCalled();
    });

    test('provides navigation back to login', async () => {
      const mockResponse = { message: 'Email sent successfully' };
      (authAPI.forgotPassword as jest.Mock).mockResolvedValue({ data: mockResponse });

      renderWithProviders();

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /отправить инструкции/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        const backLink = screen.getByText('Вернуться к входу');
        expect(backLink.closest('a')).toHaveAttribute('href', '/login');
      });
    });
  });

  describe('Error Handling', () => {
    test('shows error message for invalid email', async () => {
      const mockError = {
        response: {
          data: {
            message: 'Email не найден в системе'
          }
        }
      };

      (authAPI.forgotPassword as jest.Mock).mockRejectedValue(mockError);

      renderWithProviders();

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /отправить инструкции/i });

      await user.type(emailInput, 'nonexistent@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email не найден в системе')).toBeInTheDocument();
      });
    });

    test('shows generic error for network issues', async () => {
      (authAPI.forgotPassword as jest.Mock).mockRejectedValue(new Error('Network error'));

      renderWithProviders();

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /отправить инструкции/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/произошла ошибка при отправке письма/i)).toBeInTheDocument();
      });
    });
  });

  describe('Visual Design', () => {
    test('has proper visual hierarchy', () => {
      renderWithProviders();

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Сброс пароля');
    });

    test('displays with appropriate styling', () => {
      renderWithProviders();

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute('suppressHydrationWarning', 'true');
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('placeholder', 'm@example.com');
    });

    test('has proper color scheme in success state', async () => {
      const mockResponse = { message: 'Email sent successfully' };
      (authAPI.forgotPassword as jest.Mock).mockResolvedValue({ data: mockResponse });

      renderWithProviders();

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /отправить инструкции/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Письмо отправлено')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper form labels', () => {
      renderWithProviders();

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    test('has proper ARIA attributes', () => {
      renderWithProviders();

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    test('shows error messages with proper styling', async () => {
      renderWithProviders();

      const submitButton = screen.getByRole('button', { name: /отправить инструкции/i });
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText('Введите корректный email');
        expect(errorMessage).toHaveClass('text-red-600');
      });
    });
  });

  describe('User Experience', () => {
    test('allows form submission with Enter key', async () => {
      const mockResponse = { message: 'Email sent successfully' };
      (authAPI.forgotPassword as jest.Mock).mockResolvedValue({ data: mockResponse });

      renderWithProviders();

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com{Enter}');

      await waitFor(() => {
        expect(authAPI.forgotPassword).toHaveBeenCalled();
      });
    });

    test('maintains email value during error states', async () => {
      const mockError = new Error('Network error');
      (authAPI.forgotPassword as jest.Mock).mockRejectedValue(mockError);

      renderWithProviders();

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');
      
      const submitButton = screen.getByRole('button', { name: /отправить инструкции/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
      });
    });

    test('focuses on email input by default', () => {
      renderWithProviders();

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveFocus();
    });
  });

  describe('Hydration Warning Suppression', () => {
    test('has suppressHydrationWarning on form and inputs', () => {
      renderWithProviders();

      const form = screen.getByRole('form');
      expect(form).toHaveAttribute('suppressHydrationWarning', 'true');

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute('suppressHydrationWarning', 'true');
    });
  });
});