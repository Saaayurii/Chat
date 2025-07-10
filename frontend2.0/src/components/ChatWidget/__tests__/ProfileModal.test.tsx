import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileModal from '../ProfileModal';

describe('ProfileModal', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const mockOnClose = jest.fn();
  const mockOnLogout = jest.fn();

  const mockUserData = {
    id: '123',
    email: 'test@example.com',
    fullName: 'Test User',
    username: 'testuser',
    role: 'USER',
    profile: {
      username: 'testuser',
      lastSeenAt: new Date(),
      isOnline: true
    }
  };

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  describe('Modal Visibility', () => {
    test('renders modal when isOpen is true', () => {
      render(
        <ProfileModal
          isOpen={true}
          onClose={mockOnClose}
          userData={mockUserData}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByText('Профиль пользователя')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    test('does not render modal when isOpen is false', () => {
      render(
        <ProfileModal
          isOpen={false}
          onClose={mockOnClose}
          userData={mockUserData}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.queryByText('Профиль пользователя')).not.toBeInTheDocument();
    });

    test('renders modal with no user data', () => {
      render(
        <ProfileModal
          isOpen={true}
          onClose={mockOnClose}
          userData={null}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByText('Профиль пользователя')).toBeInTheDocument();
      expect(screen.getByText('Гость')).toBeInTheDocument();
    });
  });

  describe('User Information Display', () => {
    beforeEach(() => {
      render(
        <ProfileModal
          isOpen={true}
          onClose={mockOnClose}
          userData={mockUserData}
          onLogout={mockOnLogout}
        />
      );
    });

    test('displays user name correctly', () => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    test('displays user email correctly', () => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    test('displays user role correctly', () => {
      expect(screen.getByText('USER')).toBeInTheDocument();
    });

    test('displays user ID correctly', () => {
      expect(screen.getByText('123')).toBeInTheDocument();
    });
  });

  describe('Modal Actions', () => {
    beforeEach(() => {
      render(
        <ProfileModal
          isOpen={true}
          onClose={mockOnClose}
          userData={mockUserData}
          onLogout={mockOnLogout}
        />
      );
    });

    test('calls onClose when close button is clicked', async () => {
      const closeButton = screen.getByLabelText(/close/i);
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('calls onLogout when logout button is clicked', async () => {
      const logoutButton = screen.getByText('Выйти');
      await user.click(logoutButton);

      expect(mockOnLogout).toHaveBeenCalledTimes(1);
    });

    test('calls onClose when overlay is clicked', async () => {
      const overlay = screen.getByTestId('modal-overlay');
      await user.click(overlay);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Guest User Display', () => {
    test('shows guest information for visitor role', () => {
      const guestUserData = {
        ...mockUserData,
        role: 'VISITOR',
        fullName: null,
        username: null
      };

      render(
        <ProfileModal
          isOpen={true}
          onClose={mockOnClose}
          userData={guestUserData}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByText('Гость')).toBeInTheDocument();
    });

    test('shows login suggestion for guests', () => {
      const guestUserData = {
        ...mockUserData,
        role: 'VISITOR'
      };

      render(
        <ProfileModal
          isOpen={true}
          onClose={mockOnClose}
          userData={guestUserData}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByText(/войдите в систему/i)).toBeInTheDocument();
    });
  });

  describe('Avatar Display', () => {
    test('shows user avatar when available', () => {
      const userDataWithAvatar = {
        ...mockUserData,
        profile: {
          ...mockUserData.profile,
          avatarUrl: 'https://example.com/avatar.jpg'
        }
      };

      render(
        <ProfileModal
          isOpen={true}
          onClose={mockOnClose}
          userData={userDataWithAvatar}
          onLogout={mockOnLogout}
        />
      );

      const avatar = screen.getByRole('img');
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    test('shows fallback avatar when no avatar URL', () => {
      render(
        <ProfileModal
          isOpen={true}
          onClose={mockOnClose}
          userData={mockUserData}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByText('T')).toBeInTheDocument(); // First letter of name
    });
  });

  describe('Online Status', () => {
    test('shows online status when user is online', () => {
      render(
        <ProfileModal
          isOpen={true}
          onClose={mockOnClose}
          userData={mockUserData}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByText('В сети')).toBeInTheDocument();
    });

    test('shows offline status when user is offline', () => {
      const offlineUserData = {
        ...mockUserData,
        profile: {
          ...mockUserData.profile,
          isOnline: false
        }
      };

      render(
        <ProfileModal
          isOpen={true}
          onClose={mockOnClose}
          userData={offlineUserData}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByText('Не в сети')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    beforeEach(() => {
      render(
        <ProfileModal
          isOpen={true}
          onClose={mockOnClose}
          userData={mockUserData}
          onLogout={mockOnLogout}
        />
      );
    });

    test('closes modal when Escape key is pressed', async () => {
      await user.keyboard('{Escape}');
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('allows tab navigation between buttons', async () => {
      const logoutButton = screen.getByText('Выйти');
      const closeButton = screen.getByLabelText(/close/i);

      await user.tab();
      expect(logoutButton).toHaveFocus();

      await user.tab();
      expect(closeButton).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      render(
        <ProfileModal
          isOpen={true}
          onClose={mockOnClose}
          userData={mockUserData}
          onLogout={mockOnLogout}
        />
      );
    });

    test('has proper ARIA attributes', () => {
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-labelledby');
      expect(modal).toHaveAttribute('aria-modal', 'true');
    });

    test('traps focus within modal', async () => {
      const logoutButton = screen.getByText('Выйти');
      const closeButton = screen.getByLabelText(/close/i);

      // Focus should be trapped within modal
      await user.tab();
      expect(logoutButton).toHaveFocus();

      await user.tab();
      expect(closeButton).toHaveFocus();

      // Tabbing again should cycle back to first focusable element
      await user.tab();
      expect(logoutButton).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    test('handles undefined userData gracefully', () => {
      render(
        <ProfileModal
          isOpen={true}
          onClose={mockOnClose}
          userData={undefined}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByText('Гость')).toBeInTheDocument();
    });

    test('handles userData with missing properties', () => {
      const incompleteUserData = {
        id: '123'
      };

      render(
        <ProfileModal
          isOpen={true}
          onClose={mockOnClose}
          userData={incompleteUserData as any}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByText('123')).toBeInTheDocument();
    });
  });
});