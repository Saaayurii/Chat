import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SettingsPage from '../page';
import { useAuthStore } from '@/store/authStore';
import { authAPI } from '@/core/api';

// Mock dependencies
jest.mock('@/store/authStore');
jest.mock('@/core/api');
jest.mock('@radix-ui/themes', () => ({
  Switch: ({ checked, onCheckedChange, ...props }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      data-testid="switch"
      {...props}
    />
  ),
  Badge: ({ children, color, variant }: any) => (
    <span data-color={color} data-variant={variant} className="badge">
      {children}
    </span>
  )
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe('SettingsPage', () => {
  let queryClient: QueryClient;
  let user: ReturnType<typeof userEvent.setup>;

  const mockUser = {
    id: 'user-123',
    email: 'user@example.com',
    role: 'USER',
    profile: {
      username: 'testuser',
      fullName: 'Test User'
    },
    isActivated: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z'
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
    });
    user = userEvent.setup();
    
    mockUseAuthStore.mockReturnValue({
      user: mockUser
    });
    
    // Mock change password method if it exists
    if ('changePassword' in authAPI) {
      (authAPI.changePassword as jest.Mock) = jest.fn().mockResolvedValue({ success: true });
    }
    
    jest.clearAllMocks();
  });

  const renderWithProviders = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <SettingsPage />
      </QueryClientProvider>
    );
  };

  describe('Page Layout', () => {
    test('renders settings page structure', () => {
      renderWithProviders();

      expect(screen.getByText('Настройки')).toBeInTheDocument();
      expect(screen.getByText('Управляйте настройками вашего аккаунта')).toBeInTheDocument();
    });

    test('displays all main sections', () => {
      renderWithProviders();

      expect(screen.getByText('Безопасность')).toBeInTheDocument();
      expect(screen.getByText('Уведомления')).toBeInTheDocument();
      expect(screen.getByText('Приватность')).toBeInTheDocument();
      expect(screen.getByText('Информация об аккаунте')).toBeInTheDocument();
    });

    test('has proper semantic structure', () => {
      renderWithProviders();

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Настройки');

      const sectionHeadings = screen.getAllByRole('heading', { level: 3 });
      expect(sectionHeadings).toHaveLength(4);
      expect(sectionHeadings[0]).toHaveTextContent('Безопасность');
      expect(sectionHeadings[1]).toHaveTextContent('Уведомления');
      expect(sectionHeadings[2]).toHaveTextContent('Приватность');
      expect(sectionHeadings[3]).toHaveTextContent('Информация об аккаунте');
    });
  });

  describe('Password Change Section', () => {
    test('renders password change form', () => {
      renderWithProviders();

      expect(screen.getByLabelText('Текущий пароль')).toBeInTheDocument();
      expect(screen.getByLabelText('Новый пароль')).toBeInTheDocument();
      expect(screen.getByLabelText('Подтвердите новый пароль')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /изменить пароль/i })).toBeInTheDocument();
    });

    test('toggles password visibility', async () => {
      renderWithProviders();

      const currentPasswordInput = screen.getByLabelText('Текущий пароль');
      const toggleButton = currentPasswordInput.nextElementSibling?.querySelector('button');

      expect(currentPasswordInput).toHaveAttribute('type', 'password');

      if (toggleButton) {
        await user.click(toggleButton);
        expect(currentPasswordInput).toHaveAttribute('type', 'text');

        await user.click(toggleButton);
        expect(currentPasswordInput).toHaveAttribute('type', 'password');
      }
    });

    test('validates current password field', async () => {
      renderWithProviders();

      const submitButton = screen.getByRole('button', { name: /изменить пароль/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Введите текущий пароль')).toBeInTheDocument();
      });
    });

    test('validates new password strength', async () => {
      renderWithProviders();

      const newPasswordInput = screen.getByLabelText('Новый пароль');
      await user.type(newPasswordInput, 'weak');

      const submitButton = screen.getByRole('button', { name: /изменить пароль/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Минимум 8 символов')).toBeInTheDocument();
      });
    });

    test('validates password complexity requirements', async () => {
      renderWithProviders();

      const newPasswordInput = screen.getByLabelText('Новый пароль');
      await user.type(newPasswordInput, 'weakpassword');

      const submitButton = screen.getByRole('button', { name: /изменить пароль/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Пароль должен содержать заглавную букву, строчную букву, цифру и спецсимвол')).toBeInTheDocument();
      });
    });

    test('validates password confirmation match', async () => {
      renderWithProviders();

      const newPasswordInput = screen.getByLabelText('Новый пароль');
      const confirmPasswordInput = screen.getByLabelText('Подтвердите новый пароль');

      await user.type(newPasswordInput, 'StrongPass123!');
      await user.type(confirmPasswordInput, 'DifferentPass123!');

      const submitButton = screen.getByRole('button', { name: /изменить пароль/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Пароли не совпадают')).toBeInTheDocument();
      });
    });

    test('submits password change with valid data', async () => {
      renderWithProviders();

      const currentPasswordInput = screen.getByLabelText('Текущий пароль');
      const newPasswordInput = screen.getByLabelText('Новый пароль');
      const confirmPasswordInput = screen.getByLabelText('Подтвердите новый пароль');

      await user.type(currentPasswordInput, 'currentPassword123!');
      await user.type(newPasswordInput, 'NewStrongPass123!');
      await user.type(confirmPasswordInput, 'NewStrongPass123!');

      const submitButton = screen.getByRole('button', { name: /изменить пароль/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toHaveTextContent('Сохранение...');
        expect(submitButton).toBeDisabled();
      });
    });

    test('clears form after successful password change', async () => {
      renderWithProviders();

      const currentPasswordInput = screen.getByLabelText('Текущий пароль');
      const newPasswordInput = screen.getByLabelText('Новый пароль');
      const confirmPasswordInput = screen.getByLabelText('Подтвердите новый пароль');

      await user.type(currentPasswordInput, 'currentPassword123!');
      await user.type(newPasswordInput, 'NewStrongPass123!');
      await user.type(confirmPasswordInput, 'NewStrongPass123!');

      const submitButton = screen.getByRole('button', { name: /изменить пароль/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(currentPasswordInput).toHaveValue('');
        expect(newPasswordInput).toHaveValue('');
        expect(confirmPasswordInput).toHaveValue('');
      });
    });

    test('toggles visibility for all password fields independently', async () => {
      renderWithProviders();

      const currentPasswordInput = screen.getByLabelText('Текущий пароль');
      const newPasswordInput = screen.getByLabelText('Новый пароль');
      const confirmPasswordInput = screen.getByLabelText('Подтвердите новый пароль');

      const toggleButtons = screen.getAllByRole('button').filter(btn => 
        btn.querySelector('svg') && btn.getAttribute('type') === 'button'
      );

      expect(toggleButtons).toHaveLength(3);

      // Toggle current password visibility
      await user.click(toggleButtons[0]);
      expect(currentPasswordInput).toHaveAttribute('type', 'text');
      expect(newPasswordInput).toHaveAttribute('type', 'password');
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');

      // Toggle new password visibility
      await user.click(toggleButtons[1]);
      expect(currentPasswordInput).toHaveAttribute('type', 'text');
      expect(newPasswordInput).toHaveAttribute('type', 'text');
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');

      // Toggle confirm password visibility
      await user.click(toggleButtons[2]);
      expect(currentPasswordInput).toHaveAttribute('type', 'text');
      expect(newPasswordInput).toHaveAttribute('type', 'text');
      expect(confirmPasswordInput).toHaveAttribute('type', 'text');
    });
  });

  describe('Notifications Section', () => {
    test('renders all notification settings', () => {
      renderWithProviders();

      expect(screen.getByText('Email уведомления')).toBeInTheDocument();
      expect(screen.getByText('Push уведомления')).toBeInTheDocument();
      expect(screen.getByText('Уведомления на рабочем столе')).toBeInTheDocument();
      expect(screen.getByText('Новые сообщения')).toBeInTheDocument();
      expect(screen.getByText('Системные обновления')).toBeInTheDocument();
    });

    test('has default notification settings', () => {
      renderWithProviders();

      const switches = screen.getAllByTestId('switch');
      const notificationSwitches = switches.slice(0, 5); // First 5 switches are for notifications

      expect(notificationSwitches[0]).toBeChecked(); // email: true
      expect(notificationSwitches[1]).toBeChecked(); // push: true
      expect(notificationSwitches[2]).not.toBeChecked(); // desktop: false
      expect(notificationSwitches[3]).toBeChecked(); // newMessages: true
      expect(notificationSwitches[4]).not.toBeChecked(); // systemUpdates: false
    });

    test('toggles notification settings', async () => {
      renderWithProviders();

      const switches = screen.getAllByTestId('switch');
      const emailSwitch = switches[0];

      expect(emailSwitch).toBeChecked();

      await user.click(emailSwitch);
      expect(emailSwitch).not.toBeChecked();

      await user.click(emailSwitch);
      expect(emailSwitch).toBeChecked();
    });

    test('shows descriptive text for each notification setting', () => {
      renderWithProviders();

      expect(screen.getByText('Получать уведомления на email')).toBeInTheDocument();
      expect(screen.getByText('Получать push уведомления в браузере')).toBeInTheDocument();
      expect(screen.getByText('Показывать уведомления на рабочем столе')).toBeInTheDocument();
      expect(screen.getByText('Уведомления о новых сообщениях')).toBeInTheDocument();
      expect(screen.getByText('Уведомления об обновлениях системы')).toBeInTheDocument();
    });
  });

  describe('Privacy Section', () => {
    test('renders all privacy settings', () => {
      renderWithProviders();

      expect(screen.getByText('Показывать статус онлайн')).toBeInTheDocument();
      expect(screen.getByText('Разрешить личные сообщения')).toBeInTheDocument();
      expect(screen.getByText('Показывать время последнего посещения')).toBeInTheDocument();
    });

    test('has default privacy settings', () => {
      renderWithProviders();

      const switches = screen.getAllByTestId('switch');
      const privacySwitches = switches.slice(5, 8); // Last 3 switches are for privacy

      expect(privacySwitches[0]).toBeChecked(); // showOnlineStatus: true
      expect(privacySwitches[1]).toBeChecked(); // allowDirectMessages: true
      expect(privacySwitches[2]).not.toBeChecked(); // showLastSeen: false
    });

    test('toggles privacy settings', async () => {
      renderWithProviders();

      const switches = screen.getAllByTestId('switch');
      const onlineStatusSwitch = switches[5];

      expect(onlineStatusSwitch).toBeChecked();

      await user.click(onlineStatusSwitch);
      expect(onlineStatusSwitch).not.toBeChecked();

      await user.click(onlineStatusSwitch);
      expect(onlineStatusSwitch).toBeChecked();
    });

    test('shows descriptive text for each privacy setting', () => {
      renderWithProviders();

      expect(screen.getByText('Другие пользователи смогут видеть, что вы онлайн')).toBeInTheDocument();
      expect(screen.getByText('Позволить другим пользователям писать вам напрямую')).toBeInTheDocument();
      expect(screen.getByText('Другие увидят, когда вы были онлайн в последний раз')).toBeInTheDocument();
    });
  });

  describe('Account Information Section', () => {
    test('displays user account information', () => {
      renderWithProviders();

      expect(screen.getByText('ID пользователя')).toBeInTheDocument();
      expect(screen.getByText('user-123')).toBeInTheDocument();

      expect(screen.getByText('Дата регистрации')).toBeInTheDocument();
      expect(screen.getByText('01.01.2024')).toBeInTheDocument();

      expect(screen.getByText('Статус активации')).toBeInTheDocument();
      expect(screen.getByText('Активирован')).toBeInTheDocument();

      expect(screen.getByText('Последнее обновление')).toBeInTheDocument();
      expect(screen.getByText('15.01.2024')).toBeInTheDocument();
    });

    test('shows correct activation status for activated user', () => {
      renderWithProviders();

      const activationBadge = screen.getByText('Активирован');
      expect(activationBadge).toHaveAttribute('data-color', 'green');
    });

    test('shows correct activation status for non-activated user', () => {
      const nonActivatedUser = { ...mockUser, isActivated: false };
      mockUseAuthStore.mockReturnValue({ user: nonActivatedUser });

      renderWithProviders();

      const activationBadge = screen.getByText('Не активирован');
      expect(activationBadge).toHaveAttribute('data-color', 'orange');
    });

    test('handles missing date information gracefully', () => {
      const userWithoutDates = { 
        ...mockUser, 
        createdAt: undefined, 
        updatedAt: undefined 
      };
      mockUseAuthStore.mockReturnValue({ user: userWithoutDates });

      renderWithProviders();

      expect(screen.getAllByText('Неизвестно')).toHaveLength(2);
    });

    test('displays user ID in monospace font', () => {
      renderWithProviders();

      const userIdElement = screen.getByText('user-123');
      expect(userIdElement).toHaveClass('font-mono');
    });
  });

  describe('Form Interactions', () => {
    test('prevents form submission with invalid data', async () => {
      renderWithProviders();

      const submitButton = screen.getByRole('button', { name: /изменить пароль/i });
      await user.click(submitButton);

      // Form should not submit and should show validation errors
      expect(screen.getByText('Введите текущий пароль')).toBeInTheDocument();
      expect(submitButton).not.toHaveTextContent('Сохранение...');
    });

    test('allows form submission with valid data', async () => {
      renderWithProviders();

      const currentPasswordInput = screen.getByLabelText('Текущий пароль');
      const newPasswordInput = screen.getByLabelText('Новый пароль');
      const confirmPasswordInput = screen.getByLabelText('Подтвердите новый пароль');

      await user.type(currentPasswordInput, 'CurrentPass123!');
      await user.type(newPasswordInput, 'NewStrongPass123!');
      await user.type(confirmPasswordInput, 'NewStrongPass123!');

      const submitButton = screen.getByRole('button', { name: /изменить пароль/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toHaveTextContent('Сохранение...');
      });
    });

    test('maintains switch states during interactions', async () => {
      renderWithProviders();

      const switches = screen.getAllByTestId('switch');
      const emailSwitch = switches[0];
      const pushSwitch = switches[1];

      // Toggle email switch
      await user.click(emailSwitch);
      expect(emailSwitch).not.toBeChecked();

      // Toggle push switch
      await user.click(pushSwitch);
      expect(pushSwitch).not.toBeChecked();

      // Email switch should maintain its state
      expect(emailSwitch).not.toBeChecked();
    });
  });

  describe('Loading States', () => {
    test('shows loading state during password change', async () => {
      // Mock a delayed API response
      const delayedMutation = jest.fn(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );

      renderWithProviders();

      const currentPasswordInput = screen.getByLabelText('Текущий пароль');
      const newPasswordInput = screen.getByLabelText('Новый пароль');
      const confirmPasswordInput = screen.getByLabelText('Подтвердите новый пароль');

      await user.type(currentPasswordInput, 'CurrentPass123!');
      await user.type(newPasswordInput, 'NewStrongPass123!');
      await user.type(confirmPasswordInput, 'NewStrongPass123!');

      const submitButton = screen.getByRole('button', { name: /изменить пароль/i });
      await user.click(submitButton);

      expect(submitButton).toHaveTextContent('Сохранение...');
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    test('has proper form labels', () => {
      renderWithProviders();

      expect(screen.getByLabelText('Текущий пароль')).toBeInTheDocument();
      expect(screen.getByLabelText('Новый пароль')).toBeInTheDocument();
      expect(screen.getByLabelText('Подтвердите новый пароль')).toBeInTheDocument();
    });

    test('associates error messages with form fields', async () => {
      renderWithProviders();

      const submitButton = screen.getByRole('button', { name: /изменить пароль/i });
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText('Введите текущий пароль');
        expect(errorMessage).toHaveClass('text-destructive');
      });
    });

    test('provides descriptive text for settings sections', () => {
      renderWithProviders();

      // Check that each switch has descriptive text
      expect(screen.getByText('Получать уведомления на email')).toBeInTheDocument();
      expect(screen.getByText('Другие пользователи смогут видеть, что вы онлайн')).toBeInTheDocument();
    });

    test('uses semantic HTML structure', () => {
      renderWithProviders();

      // Check for proper form structure
      const passwordForm = screen.getByRole('form');
      expect(passwordForm).toBeInTheDocument();

      // Check for proper button labeling
      const changePasswordButton = screen.getByRole('button', { name: /изменить пароль/i });
      expect(changePasswordButton).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('handles missing user data gracefully', () => {
      mockUseAuthStore.mockReturnValue({ user: null });

      renderWithProviders();

      // Should still render the page structure
      expect(screen.getByText('Настройки')).toBeInTheDocument();
      
      // User-specific data should show fallback values
      expect(screen.getAllByText('Неизвестно')).toHaveLength(2);
    });

    test('handles user without activation status', () => {
      const userWithoutActivation = { 
        ...mockUser, 
        isActivated: undefined 
      };
      mockUseAuthStore.mockReturnValue({ user: userWithoutActivation });

      renderWithProviders();

      // Should render without crashing
      expect(screen.getByText('Настройки')).toBeInTheDocument();
    });
  });

  describe('Visual Design', () => {
    test('applies correct styling classes', () => {
      renderWithProviders();

      const mainContainer = screen.getByText('Настройки').closest('.min-h-screen');
      expect(mainContainer).toHaveClass('min-h-screen', 'bg-background');

      const cardElements = document.querySelectorAll('.bg-card');
      expect(cardElements.length).toBeGreaterThan(0);
    });

    test('uses icons appropriately', () => {
      renderWithProviders();

      // Check that section headers have icons
      const securitySection = screen.getByText('Безопасность').closest('h3');
      expect(securitySection?.querySelector('svg')).toBeInTheDocument();

      const notificationsSection = screen.getByText('Уведомления').closest('h3');
      expect(notificationsSection?.querySelector('svg')).toBeInTheDocument();

      const privacySection = screen.getByText('Приватность').closest('h3');
      expect(privacySection?.querySelector('svg')).toBeInTheDocument();
    });
  });
});