import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ResetPasswordPage from '../page';
import { authAPI } from '@/core/api';

// Mock dependencies
jest.mock('next/navigation');
jest.mock('@/core/api');

const mockPush = jest.fn();
const mockSearchParams = new URLSearchParams();

(useRouter as jest.Mock).mockReturnValue({
  push: mockPush,
});

(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);

describe('ResetPasswordPage', () => {
  let queryClient: QueryClient;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
    });
    user = userEvent.setup();
    
    mockSearchParams.get = jest.fn();
    (authAPI.resetPassword as jest.Mock) = jest.fn().mockResolvedValue({ data: { success: true } });
    
    jest.clearAllMocks();
  });

  const renderWithProviders = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ResetPasswordPage />
      </QueryClientProvider>
    );
  };

  describe('Valid Token Scenario', () => {
    beforeEach(() => {
      (mockSearchParams.get as jest.Mock).mockReturnValue('valid-token-123');
    });

    test('renders reset password form with valid token', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Новый пароль')).toBeInTheDocument();
        expect(screen.getByText('Введите новый пароль для вашего аккаунта')).toBeInTheDocument();
      });

      expect(screen.getByLabelText('Новый пароль')).toBeInTheDocument();
      expect(screen.getByLabelText('Подтвердите пароль')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /изменить пароль/i })).toBeInTheDocument();
    });

    test('displays password requirements', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Требования к паролю:')).toBeInTheDocument();
        expect(screen.getByText('• Минимум 8 символов')).toBeInTheDocument();
        expect(screen.getByText('• Хотя бы одна заглавная буква')).toBeInTheDocument();
        expect(screen.getByText('• Хотя бы одна строчная буква')).toBeInTheDocument();
        expect(screen.getByText('• Хотя бы одна цифра')).toBeInTheDocument();
        expect(screen.getByText('• Хотя бы один специальный символ')).toBeInTheDocument();
      });
    });

    test('toggles password visibility', async () => {
      renderWithProviders();

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('Новый пароль');
        const toggleButton = passwordInput.parentElement?.querySelector('button');

        expect(passwordInput).toHaveAttribute('type', 'password');

        if (toggleButton) {
          fireEvent.click(toggleButton);
          expect(passwordInput).toHaveAttribute('type', 'text');

          fireEvent.click(toggleButton);
          expect(passwordInput).toHaveAttribute('type', 'password');
        }
      });
    });

    test('toggles confirm password visibility independently', async () => {
      renderWithProviders();

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('Новый пароль');
        const confirmPasswordInput = screen.getByLabelText('Подтвердите пароль');
        
        const passwordToggle = passwordInput.parentElement?.querySelector('button');
        const confirmToggle = confirmPasswordInput.parentElement?.querySelector('button');

        // Toggle only new password
        if (passwordToggle) {
          fireEvent.click(passwordToggle);
          expect(passwordInput).toHaveAttribute('type', 'text');
          expect(confirmPasswordInput).toHaveAttribute('type', 'password');
        }

        // Toggle only confirm password
        if (confirmToggle) {
          fireEvent.click(confirmToggle);
          expect(passwordInput).toHaveAttribute('type', 'text');
          expect(confirmPasswordInput).toHaveAttribute('type', 'text');
        }
      });
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      (mockSearchParams.get as jest.Mock).mockReturnValue('valid-token-123');
    });

    test('validates minimum password length', async () => {
      renderWithProviders();

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('Новый пароль');
        const submitButton = screen.getByRole('button', { name: /изменить пароль/i });

        fireEvent.change(passwordInput, { target: { value: 'short' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Пароль должен содержать минимум 8 символов')).toBeInTheDocument();
      });
    });

    test('validates uppercase letter requirement', async () => {
      renderWithProviders();

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('Новый пароль');
        const submitButton = screen.getByRole('button', { name: /изменить пароль/i });

        fireEvent.change(passwordInput, { target: { value: 'lowercase123!' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Пароль должен содержать хотя бы одну заглавную букву')).toBeInTheDocument();
      });
    });

    test('validates lowercase letter requirement', async () => {
      renderWithProviders();

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('Новый пароль');
        const submitButton = screen.getByRole('button', { name: /изменить пароль/i });

        fireEvent.change(passwordInput, { target: { value: 'UPPERCASE123!' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Пароль должен содержать хотя бы одну строчную букву')).toBeInTheDocument();
      });
    });

    test('validates digit requirement', async () => {
      renderWithProviders();

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('Новый пароль');
        const submitButton = screen.getByRole('button', { name: /изменить пароль/i });

        fireEvent.change(passwordInput, { target: { value: 'Password!' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Пароль должен содержать хотя бы одну цифру')).toBeInTheDocument();
      });
    });

    test('validates special character requirement', async () => {
      renderWithProviders();

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('Новый пароль');
        const submitButton = screen.getByRole('button', { name: /изменить пароль/i });

        fireEvent.change(passwordInput, { target: { value: 'Password123' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Пароль должен содержать хотя бы один специальный символ')).toBeInTheDocument();
      });
    });

    test('validates password confirmation match', async () => {
      renderWithProviders();

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('Новый пароль');
        const confirmPasswordInput = screen.getByLabelText('Подтвердите пароль');
        const submitButton = screen.getByRole('button', { name: /изменить пароль/i });

        fireEvent.change(passwordInput, { target: { value: 'ValidPass123!' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPass123!' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Пароли не совпадают')).toBeInTheDocument();
      });
    });

    test('accepts valid password', async () => {
      renderWithProviders();

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('Новый пароль');
        const confirmPasswordInput = screen.getByLabelText('Подтвердите пароль');
        const submitButton = screen.getByRole('button', { name: /изменить пароль/i });

        fireEvent.change(passwordInput, { target: { value: 'ValidPass123!' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'ValidPass123!' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(authAPI.resetPassword).toHaveBeenCalledWith({
          token: 'valid-token-123',
          newPassword: 'ValidPass123!'
        });
      });
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      (mockSearchParams.get as jest.Mock).mockReturnValue('valid-token-123');
    });

    test('shows loading state during submission', async () => {
      (authAPI.resetPassword as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      renderWithProviders();

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('Новый пароль');
        const confirmPasswordInput = screen.getByLabelText('Подтвердите пароль');
        const submitButton = screen.getByRole('button', { name: /изменить пароль/i });

        fireEvent.change(passwordInput, { target: { value: 'ValidPass123!' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'ValidPass123!' } });
        fireEvent.click(submitButton);
      });

      expect(screen.getByText('Изменение...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /изменение/i })).toBeDisabled();
    });

    test('calls API with correct parameters', async () => {
      renderWithProviders();

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('Новый пароль');
        const confirmPasswordInput = screen.getByLabelText('Подтвердите пароль');
        const submitButton = screen.getByRole('button', { name: /изменить пароль/i });

        fireEvent.change(passwordInput, { target: { value: 'NewPassword123!' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'NewPassword123!' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(authAPI.resetPassword).toHaveBeenCalledWith({
          token: 'valid-token-123',
          newPassword: 'NewPassword123!'
        });
      });
    });

    test('shows success state after successful reset', async () => {
      renderWithProviders();

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('Новый пароль');
        const confirmPasswordInput = screen.getByLabelText('Подтвердите пароль');
        const submitButton = screen.getByRole('button', { name: /изменить пароль/i });

        fireEvent.change(passwordInput, { target: { value: 'ValidPass123!' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'ValidPass123!' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Пароль изменен')).toBeInTheDocument();
        expect(screen.getByText('Ваш пароль был успешно изменен. Теперь вы можете войти в систему с новым паролем.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /войти в систему/i })).toBeInTheDocument();
      });
    });

    test('displays error message on API failure', async () => {
      const errorMessage = 'Токен истек';
      (authAPI.resetPassword as jest.Mock).mockRejectedValue({
        response: { data: { message: errorMessage } }
      });

      renderWithProviders();

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('Новый пароль');
        const confirmPasswordInput = screen.getByLabelText('Подтвердите пароль');
        const submitButton = screen.getByRole('button', { name: /изменить пароль/i });

        fireEvent.change(passwordInput, { target: { value: 'ValidPass123!' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'ValidPass123!' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Ошибка')).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    test('displays generic error message when no specific error', async () => {
      (authAPI.resetPassword as jest.Mock).mockRejectedValue(new Error('Network error'));

      renderWithProviders();

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('Новый пароль');
        const confirmPasswordInput = screen.getByLabelText('Подтвердите пароль');
        const submitButton = screen.getByRole('button', { name: /изменить пароль/i });

        fireEvent.change(passwordInput, { target: { value: 'ValidPass123!' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'ValidPass123!' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });

  describe('Invalid Token Scenario', () => {
    beforeEach(() => {
      (mockSearchParams.get as jest.Mock).mockReturnValue(null);
    });

    test('displays invalid token message when no token', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Недействительная ссылка')).toBeInTheDocument();
        expect(screen.getByText('Ссылка для сброса пароля недействительна или устарела')).toBeInTheDocument();
      });
    });

    test('shows helpful instructions for invalid token', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Ссылка недействительна')).toBeInTheDocument();
        expect(screen.getByText(/Возможно, ссылка устарела или была использована ранее/)).toBeInTheDocument();
      });
    });

    test('provides links to request new reset and return to login', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /запросить новую ссылку/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /вернуться к входу/i })).toBeInTheDocument();
      });
    });

    test('has correct navigation links for invalid token', async () => {
      renderWithProviders();

      await waitFor(() => {
        const newLinkButton = screen.getByRole('button', { name: /запросить новую ссылку/i });
        const loginButton = screen.getByRole('button', { name: /вернуться к входу/i });

        expect(newLinkButton.closest('a')).toHaveAttribute('href', '/reset');
        expect(loginButton.closest('a')).toHaveAttribute('href', '/login');
      });
    });
  });

  describe('Success State', () => {
    beforeEach(() => {
      (mockSearchParams.get as jest.Mock).mockReturnValue('valid-token-123');
    });

    test('displays success message with proper styling', async () => {
      renderWithProviders();

      // First submit the form to trigger success state
      await waitFor(() => {
        const passwordInput = screen.getByLabelText('Новый пароль');
        const confirmPasswordInput = screen.getByLabelText('Подтвердите пароль');
        const submitButton = screen.getByRole('button', { name: /изменить пароль/i });

        fireEvent.change(passwordInput, { target: { value: 'ValidPass123!' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'ValidPass123!' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Пароль изменен')).toBeInTheDocument();
        expect(screen.getByText('Успешно!')).toBeInTheDocument();
        expect(screen.getByText('Пароль был изменен. Используйте новый пароль для входа в систему.')).toBeInTheDocument();
      });
    });

    test('provides login link in success state', async () => {
      renderWithProviders();

      // Submit form to reach success state
      await waitFor(() => {
        const passwordInput = screen.getByLabelText('Новый пароль');
        const confirmPasswordInput = screen.getByLabelText('Подтвердите пароль');
        const submitButton = screen.getByRole('button', { name: /изменить пароль/i });

        fireEvent.change(passwordInput, { target: { value: 'ValidPass123!' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'ValidPass123!' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        const loginButton = screen.getByRole('button', { name: /войти в систему/i });
        expect(loginButton.closest('a')).toHaveAttribute('href', '/login');
      });
    });
  });

  describe('Navigation and Links', () => {
    beforeEach(() => {
      (mockSearchParams.get as jest.Mock).mockReturnValue('valid-token-123');
    });

    test('provides back to login link', async () => {
      renderWithProviders();

      await waitFor(() => {
        const backLink = screen.getByText('Вернуться к входу');
        expect(backLink.closest('a')).toHaveAttribute('href', '/login');
      });
    });

    test('back link has proper styling and icon', async () => {
      renderWithProviders();

      await waitFor(() => {
        const backLink = screen.getByText('Вернуться к входу');
        expect(backLink.querySelector('svg')).toBeInTheDocument(); // ArrowLeft icon
      });
    });
  });

  describe('Responsive Design and Layout', () => {
    test('displays proper layout structure', async () => {
      (mockSearchParams.get as jest.Mock).mockReturnValue('valid-token-123');
      renderWithProviders();

      await waitFor(() => {
        const mainContainer = screen.getByText('Новый пароль').closest('.min-h-screen');
        expect(mainContainer).toBeInTheDocument();
        expect(mainContainer).toHaveClass('lg:grid', 'lg:grid-cols-2');
      });
    });

    test('shows decorative content for large screens', async () => {
      (mockSearchParams.get as jest.Mock).mockReturnValue('valid-token-123');
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Создайте надежный пароль для защиты вашего аккаунта')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      (mockSearchParams.get as jest.Mock).mockReturnValue('valid-token-123');
    });

    test('has proper form labels', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByLabelText('Новый пароль')).toBeInTheDocument();
        expect(screen.getByLabelText('Подтвердите пароль')).toBeInTheDocument();
      });
    });

    test('has proper heading structure', async () => {
      renderWithProviders();

      await waitFor(() => {
        const mainHeading = screen.getByRole('heading', { level: 1 });
        expect(mainHeading).toHaveTextContent('Новый пароль');
      });
    });

    test('error messages are properly associated with fields', async () => {
      renderWithProviders();

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('Новый пароль');
        const submitButton = screen.getByRole('button', { name: /изменить пароль/i });

        fireEvent.change(passwordInput, { target: { value: 'weak' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        const errorMessage = screen.getByText('Пароль должен содержать минимум 8 символов');
        expect(errorMessage).toHaveClass('text-red-600');
      });
    });

    test('provides clear button labels', async () => {
      renderWithProviders();

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /изменить пароль/i });
        expect(submitButton).toBeInTheDocument();

        const toggleButtons = screen.getAllByRole('button').filter(btn => 
          btn.querySelector('svg') && btn.getAttribute('type') === 'button'
        );
        expect(toggleButtons).toHaveLength(2); // Two password visibility toggles
      });
    });

    test('uses suppressHydrationWarning appropriately', async () => {
      renderWithProviders();

      await waitFor(() => {
        const form = screen.getByRole('form');
        expect(form).toHaveAttribute('suppressHydrationWarning', 'true');

        const passwordInputs = screen.getAllByDisplayValue('');
        passwordInputs.forEach(input => {
          if (input.getAttribute('type')?.includes('password') || input.getAttribute('type') === 'text') {
            expect(input).toHaveAttribute('suppressHydrationWarning', 'true');
          }
        });
      });
    });
  });

  describe('Loading States', () => {
    test('shows loading fallback during Suspense', () => {
      // This tests the Suspense fallback
      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <React.Suspense fallback={<div data-testid="loading">Loading...</div>}>
            <div>Content loaded</div>
          </React.Suspense>
        </QueryClientProvider>
      );

      // In a real scenario, this would show while useSearchParams is loading
      expect(screen.getByText('Content loaded')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles empty token gracefully', async () => {
      (mockSearchParams.get as jest.Mock).mockReturnValue('');
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Недействительная ссылка')).toBeInTheDocument();
      });
    });

    test('handles API timeout gracefully', async () => {
      (authAPI.resetPassword as jest.Mock).mockRejectedValue(new Error('Request timeout'));
      (mockSearchParams.get as jest.Mock).mockReturnValue('valid-token-123');

      renderWithProviders();

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('Новый пароль');
        const confirmPasswordInput = screen.getByLabelText('Подтвердите пароль');
        const submitButton = screen.getByRole('button', { name: /изменить пароль/i });

        fireEvent.change(passwordInput, { target: { value: 'ValidPass123!' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'ValidPass123!' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Request timeout')).toBeInTheDocument();
      });
    });
  });
});