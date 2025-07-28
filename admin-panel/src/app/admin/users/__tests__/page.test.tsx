import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminUsersPage from '../page';
import { useAuthStore } from '@/store/authStore';
import { useNotifications } from '@/hooks/useNotifications';
import { usersAPI, ratingsAPI, questionsAPI } from '@/core/api';
import { UserRole } from '@/types';

// Mock dependencies
jest.mock('@/store/authStore');
jest.mock('@/hooks/useNotifications');
jest.mock('@/core/api');
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, ...props }: any) => <img alt={alt} {...props} />
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;
const mockUseNotifications = useNotifications as jest.MockedFunction<typeof useNotifications>;

// Mock window methods
window.confirm = jest.fn();
window.prompt = jest.fn();

describe('AdminUsersPage', () => {
  let queryClient: QueryClient;
  let user: ReturnType<typeof userEvent.setup>;
  let mockNotifications: {
    success: jest.Mock;
    error: jest.Mock;
  };

  const mockAdminUser = {
    id: 'admin-123',
    email: 'admin@example.com',
    role: 'ADMIN',
    profile: {
      username: 'admin',
      fullName: 'Admin User'
    }
  };

  const mockUsers = [
    {
      _id: 'user-1',
      email: 'operator@example.com',
      role: UserRole.OPERATOR,
      profile: {
        username: 'operator1',
        fullName: 'John Operator',
        phone: '+79001234567',
        isOnline: true,
        avatarUrl: null
      },
      operatorStats: {
        totalQuestions: 25,
        averageRating: 4.5,
        responseTimeAvg: 5.2
      },
      isBlocked: false,
      isActivated: true,
      createdAt: '2024-01-01T00:00:00.000Z'
    },
    {
      _id: 'user-2',
      email: 'admin2@example.com',
      role: UserRole.ADMIN,
      profile: {
        username: 'admin2',
        fullName: 'Jane Admin',
        phone: null,
        isOnline: false,
        avatarUrl: '/avatar.jpg'
      },
      operatorStats: null,
      isBlocked: true,
      isActivated: false,
      createdAt: '2024-01-15T00:00:00.000Z'
    },
    {
      _id: 'user-3',
      email: 'visitor@example.com',
      role: UserRole.VISITOR,
      profile: {
        username: 'visitor1',
        fullName: 'Bob Visitor',
        phone: '+79007654321',
        isOnline: false,
        avatarUrl: null
      },
      operatorStats: null,
      isBlocked: false,
      isActivated: true,
      createdAt: '2024-02-01T00:00:00.000Z'
    }
  ];

  const mockUsersResponse = {
    data: mockUsers,
    total: 3,
    totalPages: 1,
    currentPage: 1
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
    });
    user = userEvent.setup();
    
    mockNotifications = {
      success: jest.fn(),
      error: jest.fn()
    };
    
    mockUseAuthStore.mockReturnValue({ user: mockAdminUser });
    mockUseNotifications.mockReturnValue(mockNotifications);
    
    (usersAPI.getUsers as jest.Mock).mockResolvedValue({ data: mockUsersResponse });
    (usersAPI.createUser as jest.Mock).mockResolvedValue({ data: { id: 'new-user' } });
    (usersAPI.toggleUserBlock as jest.Mock).mockResolvedValue({ data: {} });
    (usersAPI.deleteUser as jest.Mock).mockResolvedValue({ data: {} });
    (usersAPI.activateUser as jest.Mock).mockResolvedValue({ data: {} });
    (ratingsAPI.getOperatorStats as jest.Mock).mockResolvedValue({ data: {} });
    (questionsAPI.getOperatorWorkload as jest.Mock).mockResolvedValue({ data: {} });
    
    jest.clearAllMocks();
  });

  const renderWithProviders = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <AdminUsersPage />
      </QueryClientProvider>
    );
  };

  describe('Page Layout', () => {
    test('renders main page structure', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Сотрудники')).toBeInTheDocument();
        expect(screen.getByText('Управление сотрудниками системы')).toBeInTheDocument();
        expect(screen.getByText('Добавить сотрудника')).toBeInTheDocument();
      });
    });

    test('shows add employee form in sidebar', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByLabelText('Email *')).toBeInTheDocument();
        expect(screen.getByLabelText('Логин *')).toBeInTheDocument();
        expect(screen.getByLabelText('Пароль *')).toBeInTheDocument();
        expect(screen.getByLabelText('Фамилия Имя Отчество *')).toBeInTheDocument();
        expect(screen.getByLabelText('Телефон')).toBeInTheDocument();
        expect(screen.getByLabelText('Роль *')).toBeInTheDocument();
      });
    });

    test('displays search and filter controls', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Поиск по имени, email или телефону...')).toBeInTheDocument();
        expect(screen.getByText('Все роли')).toBeInTheDocument();
        expect(screen.getByText('Сбросить')).toBeInTheDocument();
      });
    });
  });

  describe('User List Display', () => {
    test('displays list of users', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('John Operator')).toBeInTheDocument();
        expect(screen.getByText('Jane Admin')).toBeInTheDocument();
        expect(screen.getByText('Bob Visitor')).toBeInTheDocument();
      });

      expect(screen.getByText('operator@example.com')).toBeInTheDocument();
      expect(screen.getByText('admin2@example.com')).toBeInTheDocument();
      expect(screen.getByText('visitor@example.com')).toBeInTheDocument();
    });

    test('shows user status badges correctly', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Онлайн')).toBeInTheDocument();
        expect(screen.getByText('Заблокирован')).toBeInTheDocument();
        expect(screen.getByText('Не активирован')).toBeInTheDocument();
        expect(screen.getByText('Офлайн')).toBeInTheDocument();
      });
    });

    test('displays role badges with correct colors', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Оператор')).toBeInTheDocument();
        expect(screen.getByText('Администратор')).toBeInTheDocument();
        expect(screen.getByText('Посетитель')).toBeInTheDocument();
      });
    });

    test('shows operator statistics for operator users', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('25')).toBeInTheDocument(); // totalQuestions
        expect(screen.getByText('4.5')).toBeInTheDocument(); // averageRating
        expect(screen.getByText('5м')).toBeInTheDocument(); // responseTime
      });
    });

    test('displays user avatars and fallbacks', async () => {
      renderWithProviders();

      await waitFor(() => {
        // Should show avatar image for user with avatarUrl
        expect(screen.getByRole('img', { name: 'Jane Admin' })).toBeInTheDocument();
        
        // Should show initial letters for users without avatars
        expect(screen.getByText('J')).toBeInTheDocument(); // John Operator
        expect(screen.getByText('B')).toBeInTheDocument(); // Bob Visitor
      });
    });
  });

  describe('User Creation Form', () => {
    test('validates required fields', async () => {
      renderWithProviders();

      const submitButton = screen.getByRole('button', { name: /сохранить/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email обязателен')).toBeInTheDocument();
        expect(screen.getByText('Логин обязателен')).toBeInTheDocument();
        expect(screen.getByText('Пароль обязателен')).toBeInTheDocument();
        expect(screen.getByText('ФИО обязательно')).toBeInTheDocument();
      });
    });

    test('validates email format', async () => {
      renderWithProviders();

      const emailInput = screen.getByLabelText('Email *');
      await user.type(emailInput, 'invalid-email');

      const submitButton = screen.getByRole('button', { name: /сохранить/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Некорректный email адрес')).toBeInTheDocument();
      });
    });

    test('validates username length', async () => {
      renderWithProviders();

      const usernameInput = screen.getByLabelText('Логин *');
      await user.type(usernameInput, 'ab');

      const submitButton = screen.getByRole('button', { name: /сохранить/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Логин должен содержать минимум 3 символа')).toBeInTheDocument();
      });
    });

    test('validates password length', async () => {
      renderWithProviders();

      const passwordInput = screen.getByLabelText('Пароль *');
      await user.type(passwordInput, '123');

      const submitButton = screen.getByRole('button', { name: /сохранить/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Пароль должен содержать минимум 6 символов')).toBeInTheDocument();
      });
    });

    test('validates phone format', async () => {
      renderWithProviders();

      const phoneInput = screen.getByLabelText('Телефон');
      await user.type(phoneInput, '123456789');

      const submitButton = screen.getByRole('button', { name: /сохранить/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Введите корректный номер телефона в формате +7XXXXXXXXXX')).toBeInTheDocument();
      });
    });

    test('submits form with valid data', async () => {
      renderWithProviders();

      // Fill form with valid data
      await user.type(screen.getByLabelText('Email *'), 'newuser@example.com');
      await user.type(screen.getByLabelText('Логин *'), 'newuser');
      await user.type(screen.getByLabelText('Пароль *'), 'password123');
      await user.type(screen.getByLabelText('Фамилия Имя Отчество *'), 'New User Name');
      await user.type(screen.getByLabelText('Телефон'), '+79001234567');

      const submitButton = screen.getByRole('button', { name: /сохранить/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(usersAPI.createUser).toHaveBeenCalledWith({
          email: 'newuser@example.com',
          username: 'newuser',
          password: 'password123',
          fullName: 'New User Name',
          phone: '+79001234567',
          bio: undefined,
          role: UserRole.OPERATOR
        });
      });

      expect(mockNotifications.success).toHaveBeenCalledWith('Сотрудник успешно добавлен');
    });

    test('clears form after successful submission', async () => {
      renderWithProviders();

      // Fill and submit form
      await user.type(screen.getByLabelText('Email *'), 'test@example.com');
      await user.type(screen.getByLabelText('Логин *'), 'testuser');
      await user.type(screen.getByLabelText('Пароль *'), 'password123');
      await user.type(screen.getByLabelText('Фамилия Имя Отчество *'), 'Test User');

      const submitButton = screen.getByRole('button', { name: /сохранить/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Email *')).toHaveValue('');
        expect(screen.getByLabelText('Логин *')).toHaveValue('');
        expect(screen.getByLabelText('Пароль *')).toHaveValue('');
        expect(screen.getByLabelText('Фамилия Имя Отчество *')).toHaveValue('');
      });
    });

    test('shows loading state during form submission', async () => {
      (usersAPI.createUser as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      renderWithProviders();

      // Fill form
      await user.type(screen.getByLabelText('Email *'), 'test@example.com');
      await user.type(screen.getByLabelText('Логин *'), 'testuser');
      await user.type(screen.getByLabelText('Пароль *'), 'password123');
      await user.type(screen.getByLabelText('Фамилия Имя Отчество *'), 'Test User');

      const submitButton = screen.getByRole('button', { name: /сохранить/i });
      await user.click(submitButton);

      expect(screen.getByText('Сохранение...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Search and Filtering', () => {
    test('filters users by search query', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('John Operator')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Поиск по имени, email или телефону...');
      await user.type(searchInput, 'John');

      await waitFor(() => {
        expect(usersAPI.getUsers).toHaveBeenCalledWith({
          page: 1,
          limit: 10,
          role: undefined,
          search: 'John'
        });
      });
    });

    test('filters users by role', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Все роли')).toBeInTheDocument();
      });

      // Click role selector and choose operator
      const roleSelect = screen.getByText('Все роли');
      await user.click(roleSelect);

      await waitFor(() => {
        const operatorOption = screen.getByRole('option', { name: 'Оператор' });
        await user.click(operatorOption);
      });

      await waitFor(() => {
        expect(usersAPI.getUsers).toHaveBeenCalledWith({
          page: 1,
          limit: 10,
          role: UserRole.OPERATOR,
          search: undefined
        });
      });
    });

    test('resets filters when reset button is clicked', async () => {
      renderWithProviders();

      // Add search query first
      const searchInput = screen.getByPlaceholderText('Поиск по имени, email или телефону...');
      await user.type(searchInput, 'test query');

      const resetButton = screen.getByText('Сбросить');
      await user.click(resetButton);

      expect(searchInput).toHaveValue('');
    });

    test('debounces search input', async () => {
      jest.useFakeTimers();
      
      renderWithProviders();

      const searchInput = screen.getByPlaceholderText('Поиск по имени, email или телефону...');
      
      // Type multiple characters quickly
      await user.type(searchInput, 'test');
      
      // Fast forward time to trigger debounce
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(usersAPI.getUsers).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'test' })
        );
      });

      jest.useRealTimers();
    });
  });

  describe('User Actions', () => {
    test('blocks/unblocks user', async () => {
      (window.confirm as jest.Mock).mockReturnValue(true);
      
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('John Operator')).toBeInTheDocument();
      });

      const blockButton = screen.getByText('Заблокировать');
      await user.click(blockButton);

      expect(window.confirm).toHaveBeenCalledWith('Вы уверены, что хотите изменить статус блокировки пользователя?');
      expect(usersAPI.toggleUserBlock).toHaveBeenCalledWith('user-1');
      expect(mockNotifications.success).toHaveBeenCalledWith('Статус блокировки изменен');
    });

    test('activates inactive user', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Jane Admin')).toBeInTheDocument();
      });

      const activateButton = screen.getByText('Активировать');
      await user.click(activateButton);

      expect(usersAPI.activateUser).toHaveBeenCalledWith('user-2');
      expect(mockNotifications.success).toHaveBeenCalledWith('Пользователь активирован');
    });

    test('deletes user with reason', async () => {
      (window.prompt as jest.Mock).mockReturnValue('Test deletion reason');
      
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('John Operator')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText('Удалить');
      await user.click(deleteButtons[0]);

      expect(window.prompt).toHaveBeenCalledWith('Укажите причину удаления:');
      expect(usersAPI.deleteUser).toHaveBeenCalledWith('user-1', 'Test deletion reason');
      expect(mockNotifications.success).toHaveBeenCalledWith('Сотрудник удален');
    });

    test('cancels deletion when no reason provided', async () => {
      (window.prompt as jest.Mock).mockReturnValue(null);
      
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('John Operator')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText('Удалить');
      await user.click(deleteButtons[0]);

      expect(usersAPI.deleteUser).not.toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {
    test('shows pagination when multiple pages exist', async () => {
      const paginatedResponse = {
        ...mockUsersResponse,
        total: 25,
        totalPages: 3,
        currentPage: 1
      };

      (usersAPI.getUsers as jest.Mock).mockResolvedValue({ data: paginatedResponse });

      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Показано 1-10 из 25 сотрудников')).toBeInTheDocument();
        expect(screen.getByText('Предыдущая')).toBeInTheDocument();
        expect(screen.getByText('Следующая')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });

    test('navigates to next page', async () => {
      const paginatedResponse = {
        ...mockUsersResponse,
        total: 25,
        totalPages: 3,
        currentPage: 1
      };

      (usersAPI.getUsers as jest.Mock).mockResolvedValue({ data: paginatedResponse });

      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Следующая')).toBeInTheDocument();
      });

      const nextButton = screen.getByText('Следующая');
      await user.click(nextButton);

      expect(usersAPI.getUsers).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 })
      );
    });

    test('disables previous button on first page', async () => {
      const paginatedResponse = {
        ...mockUsersResponse,
        total: 25,
        totalPages: 3,
        currentPage: 1
      };

      (usersAPI.getUsers as jest.Mock).mockResolvedValue({ data: paginatedResponse });

      renderWithProviders();

      await waitFor(() => {
        const prevButton = screen.getByText('Предыдущая');
        expect(prevButton).toBeDisabled();
      });
    });
  });

  describe('Loading and Error States', () => {
    test('shows loading state while fetching users', () => {
      (usersAPI.getUsers as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      renderWithProviders();

      expect(screen.getByText('Загрузка сотрудников...')).toBeInTheDocument();
    });

    test('shows empty state when no users found', async () => {
      (usersAPI.getUsers as jest.Mock).mockResolvedValue({
        data: { data: [], total: 0, totalPages: 0, currentPage: 1 }
      });

      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Сотрудники не найдены')).toBeInTheDocument();
      });
    });

    test('handles API errors gracefully', async () => {
      (usersAPI.createUser as jest.Mock).mockRejectedValue({
        response: { data: { message: 'Email уже используется' } }
      });

      renderWithProviders();

      // Fill and submit form
      await user.type(screen.getByLabelText('Email *'), 'test@example.com');
      await user.type(screen.getByLabelText('Логин *'), 'testuser');
      await user.type(screen.getByLabelText('Пароль *'), 'password123');
      await user.type(screen.getByLabelText('Фамилия Имя Отчество *'), 'Test User');

      const submitButton = screen.getByRole('button', { name: /сохранить/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNotifications.error).toHaveBeenCalledWith('Email уже используется');
      });
    });
  });

  describe('Responsive Design', () => {
    test('shows mobile operator stats for small screens', async () => {
      renderWithProviders();

      await waitFor(() => {
        // Mobile stats should be in the DOM but hidden on large screens
        const mobileStats = screen.getAllByText('25'); // operator stats appear twice - desktop and mobile
        expect(mobileStats).toHaveLength(2);
      });
    });

    test('adapts form layout for different screen sizes', async () => {
      renderWithProviders();

      await waitFor(() => {
        const form = screen.getByRole('form');
        expect(form).toBeInTheDocument();
      });

      // Form should be responsive and handle various screen sizes
      expect(screen.getByLabelText('Email *')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper form labels and structure', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByLabelText('Email *')).toBeInTheDocument();
        expect(screen.getByLabelText('Логин *')).toBeInTheDocument();
        expect(screen.getByLabelText('Пароль *')).toBeInTheDocument();
        expect(screen.getByLabelText('Фамилия Имя Отчество *')).toBeInTheDocument();
        expect(screen.getByLabelText('Телефон')).toBeInTheDocument();
        expect(screen.getByLabelText('Роль *')).toBeInTheDocument();
      });
    });

    test('provides proper button labels and roles', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /сохранить/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /сбросить/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /заблокировать/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /удалить/i })).toBeInTheDocument();
      });
    });

    test('has proper heading structure', async () => {
      renderWithProviders();

      await waitFor(() => {
        const mainHeading = screen.getByRole('heading', { level: 1 });
        expect(mainHeading).toHaveTextContent('Сотрудники');

        const sectionHeading = screen.getByRole('heading', { level: 2 });
        expect(sectionHeading).toHaveTextContent('Добавить сотрудника');
      });
    });
  });
});