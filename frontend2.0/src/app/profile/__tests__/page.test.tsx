import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProfilePage from '../page';
import { useAuthStore } from '@/store/authStore';
import { authAPI, profileAPI } from '@/core/api';

// Mock dependencies
jest.mock('@/store/authStore');
jest.mock('@/core/api');
jest.mock('@radix-ui/themes', () => ({
  Spinner: ({ size }: any) => <div data-testid="spinner" data-size={size}>Loading...</div>,
  Badge: ({ children, color, variant, className }: any) => (
    <span className={`badge ${className}`} data-color={color} data-variant={variant}>
      {children}
    </span>
  )
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

// Mock FileReader
const mockFileReader = {
  readAsDataURL: jest.fn(),
  result: 'data:image/jpeg;base64,fake-image-data',
  onload: null as any
};

Object.defineProperty(window, 'FileReader', {
  writable: true,
  value: jest.fn(() => mockFileReader)
});

describe('ProfilePage', () => {
  let queryClient: QueryClient;
  let user: ReturnType<typeof userEvent.setup>;
  let mockSetAuth: jest.Mock;

  const mockUser = {
    id: 'user-123',
    email: 'user@example.com',
    role: 'operator',
    profile: {
      username: 'testuser',
      fullName: 'Test User',
      phone: '+79001234567',
      bio: 'Test bio description',
      avatarUrl: '/avatar.jpg',
      isOnline: true
    },
    operatorStats: {
      totalQuestions: 50,
      resolvedQuestions: 45,
      averageRating: 4.5
    },
    createdAt: '2024-01-01T00:00:00.000Z'
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
    });
    user = userEvent.setup();
    mockSetAuth = jest.fn();
    
    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      setAuth: mockSetAuth
    });
    
    (authAPI.getProfile as jest.Mock).mockResolvedValue({ data: { user: mockUser } });
    (profileAPI.updateProfile as jest.Mock).mockResolvedValue({ data: { username: 'updateduser' } });
    (profileAPI.uploadAvatar as jest.Mock).mockResolvedValue({ data: { avatarUrl: '/new-avatar.jpg' } });
    
    // Mock FileReader methods
    mockFileReader.readAsDataURL.mockImplementation(function() {
      if (this.onload) {
        this.onload({ target: { result: 'data:image/jpeg;base64,fake-image-data' } });
      }
    });
    
    jest.clearAllMocks();
  });

  const renderWithProviders = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ProfilePage />
      </QueryClientProvider>
    );
  };

  describe('Page Loading', () => {
    test('shows loading spinner when data is loading', () => {
      (authAPI.getProfile as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      mockUseAuthStore.mockReturnValue({
        user: null,
        setAuth: mockSetAuth
      });

      renderWithProviders();

      expect(screen.getByTestId('spinner')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('renders profile page after loading', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Профиль')).toBeInTheDocument();
        expect(screen.getByText('Управляйте информацией вашего профиля')).toBeInTheDocument();
      });
    });
  });

  describe('Profile Display', () => {
    test('displays user information correctly', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
        expect(screen.getByText('user@example.com')).toBeInTheDocument();
        expect(screen.getByText('testuser')).toBeInTheDocument();
        expect(screen.getByText('+79001234567')).toBeInTheDocument();
        expect(screen.getByText('Test bio description')).toBeInTheDocument();
      });
    });

    test('shows user avatar when available', async () => {
      renderWithProviders();

      await waitFor(() => {
        const avatarImg = screen.getByAltText('Test User');
        expect(avatarImg).toBeInTheDocument();
        expect(avatarImg).toHaveAttribute('src', '/avatar.jpg');
      });
    });

    test('shows fallback avatar when no avatar URL', async () => {
      const userWithoutAvatar = { ...mockUser, profile: { ...mockUser.profile, avatarUrl: null } };
      mockUseAuthStore.mockReturnValue({
        user: userWithoutAvatar,
        setAuth: mockSetAuth
      });
      (authAPI.getProfile as jest.Mock).mockResolvedValue({ data: { user: userWithoutAvatar } });

      renderWithProviders();

      await waitFor(() => {
        expect(screen.queryByAltText('Test User')).not.toBeInTheDocument();
        // Should show User icon as fallback
        expect(document.querySelector('svg')).toBeInTheDocument();
      });
    });

    test('displays role badge correctly', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Оператор')).toBeInTheDocument();
        const badge = screen.getByText('Оператор');
        expect(badge).toHaveAttribute('data-color', 'blue');
      });
    });

    test('shows operator statistics when available', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Статистика')).toBeInTheDocument();
        expect(screen.getByText('50')).toBeInTheDocument(); // totalQuestions
        expect(screen.getByText('45')).toBeInTheDocument(); // resolvedQuestions
        expect(screen.getByText('4.5')).toBeInTheDocument(); // averageRating
      });
    });

    test('hides statistics for non-operator users', async () => {
      const visitorUser = { ...mockUser, role: 'visitor', operatorStats: null };
      mockUseAuthStore.mockReturnValue({
        user: visitorUser,
        setAuth: mockSetAuth
      });
      (authAPI.getProfile as jest.Mock).mockResolvedValue({ data: { user: visitorUser } });

      renderWithProviders();

      await waitFor(() => {
        expect(screen.queryByText('Статистика')).not.toBeInTheDocument();
      });
    });

    test('displays creation date correctly', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('01.01.2024')).toBeInTheDocument();
      });
    });
  });

  describe('Profile Editing', () => {
    test('enters edit mode when edit button is clicked', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Редактировать')).toBeInTheDocument();
      });

      const editButton = screen.getByText('Редактировать');
      await user.click(editButton);

      expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
      expect(screen.getByDisplayValue('+79001234567')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test bio description')).toBeInTheDocument();
    });

    test('validates form fields correctly', async () => {
      renderWithProviders();

      await waitFor(() => {
        const editButton = screen.getByText('Редактировать');
        await user.click(editButton);
      });

      // Clear username field to trigger validation
      const usernameInput = screen.getByDisplayValue('testuser');
      await user.clear(usernameInput);
      await user.type(usernameInput, 'ab'); // Too short

      const saveButton = screen.getByText('Сохранить');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Минимум 3 символа')).toBeInTheDocument();
      });
    });

    test('validates username format', async () => {
      renderWithProviders();

      await waitFor(() => {
        const editButton = screen.getByText('Редактировать');
        await user.click(editButton);
      });

      const usernameInput = screen.getByDisplayValue('testuser');
      await user.clear(usernameInput);
      await user.type(usernameInput, 'invalid@username'); // Invalid characters

      const saveButton = screen.getByText('Сохранить');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Только латинские буквы, цифры, _ и -')).toBeInTheDocument();
      });
    });

    test('validates bio length', async () => {
      renderWithProviders();

      await waitFor(() => {
        const editButton = screen.getByText('Редактировать');
        await user.click(editButton);
      });

      const bioTextarea = screen.getByDisplayValue('Test bio description');
      await user.clear(bioTextarea);
      await user.type(bioTextarea, 'a'.repeat(501)); // Too long

      const saveButton = screen.getByText('Сохранить');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Максимум 500 символов')).toBeInTheDocument();
      });
    });

    test('submits form with valid data', async () => {
      renderWithProviders();

      await waitFor(() => {
        const editButton = screen.getByText('Редактировать');
        await user.click(editButton);
      });

      const usernameInput = screen.getByDisplayValue('testuser');
      await user.clear(usernameInput);
      await user.type(usernameInput, 'newusername');

      const fullNameInput = screen.getByDisplayValue('Test User');
      await user.clear(fullNameInput);
      await user.type(fullNameInput, 'Updated User');

      const saveButton = screen.getByText('Сохранить');
      await user.click(saveButton);

      await waitFor(() => {
        expect(profileAPI.updateProfile).toHaveBeenCalledWith({
          username: 'newusername',
          fullName: 'Updated User',
          phone: '+79001234567',
          bio: 'Test bio description'
        });
      });
    });

    test('cancels editing when cancel button is clicked', async () => {
      renderWithProviders();

      await waitFor(() => {
        const editButton = screen.getByText('Редактировать');
        await user.click(editButton);
      });

      const usernameInput = screen.getByDisplayValue('testuser');
      await user.clear(usernameInput);
      await user.type(usernameInput, 'modified');

      const cancelButton = screen.getByText('Отмена');
      await user.click(cancelButton);

      // Should exit edit mode and show original values
      await waitFor(() => {
        expect(screen.getByText('testuser')).toBeInTheDocument();
        expect(screen.queryByDisplayValue('modified')).not.toBeInTheDocument();
      });
    });

    test('shows loading state during form submission', async () => {
      (profileAPI.updateProfile as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      renderWithProviders();

      await waitFor(() => {
        const editButton = screen.getByText('Редактировать');
        await user.click(editButton);
      });

      const saveButton = screen.getByText('Сохранить');
      await user.click(saveButton);

      expect(screen.getByText('Сохранение...')).toBeInTheDocument();
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Avatar Upload', () => {
    test('allows avatar file selection', async () => {
      renderWithProviders();

      await waitFor(() => {
        const fileInput = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
        expect(fileInput).toBeInTheDocument();
      });

      const fileInput = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['fake-image'], 'avatar.jpg', { type: 'image/jpeg' });

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText('Сохранить фото')).toBeInTheDocument();
      });
    });

    test('shows avatar preview after file selection', async () => {
      renderWithProviders();

      const fileInput = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['fake-image'], 'avatar.jpg', { type: 'image/jpeg' });

      await user.upload(fileInput, file);

      await waitFor(() => {
        const previewImg = screen.getByAltText('Preview');
        expect(previewImg).toBeInTheDocument();
        expect(previewImg).toHaveAttribute('src', 'data:image/jpeg;base64,fake-image-data');
      });
    });

    test('uploads avatar when save button is clicked', async () => {
      renderWithProviders();

      const fileInput = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['fake-image'], 'avatar.jpg', { type: 'image/jpeg' });

      await user.upload(fileInput, file);

      await waitFor(() => {
        const saveButton = screen.getByText('Сохранить фото');
        expect(saveButton).toBeInTheDocument();
      });

      const saveButton = screen.getByText('Сохранить фото');
      await user.click(saveButton);

      expect(profileAPI.uploadAvatar).toHaveBeenCalledWith(file);
    });

    test('shows loading state during avatar upload', async () => {
      (profileAPI.uploadAvatar as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      renderWithProviders();

      const fileInput = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['fake-image'], 'avatar.jpg', { type: 'image/jpeg' });

      await user.upload(fileInput, file);

      const saveButton = screen.getByText('Сохранить фото');
      await user.click(saveButton);

      expect(screen.getByText('Загрузка...')).toBeInTheDocument();
      expect(saveButton).toBeDisabled();
    });

    test('clears avatar preview after successful upload', async () => {
      renderWithProviders();

      const fileInput = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['fake-image'], 'avatar.jpg', { type: 'image/jpeg' });

      await user.upload(fileInput, file);

      const saveButton = screen.getByText('Сохранить фото');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.queryByText('Сохранить фото')).not.toBeInTheDocument();
        expect(screen.queryByAltText('Preview')).not.toBeInTheDocument();
      });
    });
  });

  describe('Role Badge Display', () => {
    test('displays admin badge correctly', async () => {
      const adminUser = { ...mockUser, role: 'admin' };
      mockUseAuthStore.mockReturnValue({
        user: adminUser,
        setAuth: mockSetAuth
      });
      (authAPI.getProfile as jest.Mock).mockResolvedValue({ data: { user: adminUser } });

      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Администратор')).toBeInTheDocument();
        const badge = screen.getByText('Администратор');
        expect(badge).toHaveAttribute('data-color', 'red');
      });
    });

    test('displays visitor badge correctly', async () => {
      const visitorUser = { ...mockUser, role: 'visitor' };
      mockUseAuthStore.mockReturnValue({
        user: visitorUser,
        setAuth: mockSetAuth
      });
      (authAPI.getProfile as jest.Mock).mockResolvedValue({ data: { user: visitorUser } });

      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Посетитель')).toBeInTheDocument();
        const badge = screen.getByText('Посетитель');
        expect(badge).toHaveAttribute('data-color', 'gray');
      });
    });
  });

  describe('Form Field Display', () => {
    test('shows email as disabled field', async () => {
      renderWithProviders();

      await waitFor(() => {
        const editButton = screen.getByText('Редактировать');
        await user.click(editButton);
      });

      const emailInput = screen.getByDisplayValue('user@example.com');
      expect(emailInput).toBeDisabled();
      expect(screen.getByText('Email нельзя изменить')).toBeInTheDocument();
    });

    test('displays placeholder text correctly', async () => {
      renderWithProviders();

      await waitFor(() => {
        const editButton = screen.getByText('Редактировать');
        await user.click(editButton);
      });

      expect(screen.getByPlaceholderText('+7 (999) 999-99-99')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Расскажите о себе...')).toBeInTheDocument();
    });

    test('handles empty field values gracefully', async () => {
      const userWithEmptyFields = {
        ...mockUser,
        profile: {
          ...mockUser.profile,
          phone: '',
          bio: '',
          fullName: ''
        }
      };

      mockUseAuthStore.mockReturnValue({
        user: userWithEmptyFields,
        setAuth: mockSetAuth
      });
      (authAPI.getProfile as jest.Mock).mockResolvedValue({ data: { user: userWithEmptyFields } });

      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Не указано')).toBeInTheDocument(); // fullName
        expect(screen.getByText('Не указан')).toBeInTheDocument(); // phone
      });
    });
  });

  describe('Auth Store Integration', () => {
    test('updates auth store after successful profile update', async () => {
      renderWithProviders();

      await waitFor(() => {
        const editButton = screen.getByText('Редактировать');
        await user.click(editButton);
      });

      const saveButton = screen.getByText('Сохранить');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockSetAuth).toHaveBeenCalledWith(
          '', // token from localStorage
          expect.objectContaining({
            profile: expect.objectContaining({
              username: 'updateduser'
            })
          })
        );
      });
    });

    test('uses localStorage token for auth update', async () => {
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn(() => 'mock-token'),
        },
        writable: true
      });

      renderWithProviders();

      await waitFor(() => {
        const editButton = screen.getByText('Редактировать');
        await user.click(editButton);
      });

      const saveButton = screen.getByText('Сохранить');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockSetAuth).toHaveBeenCalledWith(
          'mock-token',
          expect.any(Object)
        );
      });
    });
  });

  describe('Error Handling', () => {
    test('handles API errors gracefully', async () => {
      (profileAPI.updateProfile as jest.Mock).mockRejectedValue(new Error('API Error'));

      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      renderWithProviders();

      await waitFor(() => {
        const editButton = screen.getByText('Редактировать');
        await user.click(editButton);
      });

      const saveButton = screen.getByText('Сохранить');
      await user.click(saveButton);

      // Should still render the form even if update fails
      await waitFor(() => {
        expect(screen.getByText('Сохранить')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    test('handles missing user data gracefully', async () => {
      mockUseAuthStore.mockReturnValue({
        user: null,
        setAuth: mockSetAuth
      });
      (authAPI.getProfile as jest.Mock).mockResolvedValue({ data: { user: null } });

      renderWithProviders();

      // Should not crash when user data is missing
      await waitFor(() => {
        expect(screen.getByText('Профиль')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper form labels', async () => {
      renderWithProviders();

      await waitFor(() => {
        const editButton = screen.getByText('Редактировать');
        await user.click(editButton);
      });

      expect(screen.getByLabelText(/имя пользователя/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/полное имя/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/телефон/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/о себе/i)).toBeInTheDocument();
    });

    test('has proper heading structure', async () => {
      renderWithProviders();

      await waitFor(() => {
        const mainHeading = screen.getByRole('heading', { level: 1 });
        expect(mainHeading).toHaveTextContent('Профиль');

        const sectionHeading = screen.getByRole('heading', { level: 2 });
        expect(sectionHeading).toHaveTextContent('Test User');

        const formHeading = screen.getByRole('heading', { level: 3 });
        expect(formHeading).toHaveTextContent('Личная информация');
      });
    });

    test('provides proper button labels', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /редактировать/i })).toBeInTheDocument();
      });

      const editButton = screen.getByText('Редактировать');
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /сохранить/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /отмена/i })).toBeInTheDocument();
      });
    });
  });
});