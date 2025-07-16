import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RatingsManagement from '../RatingsManagement';
import { useAuthStore } from '@/store/authStore';
import { useRatingsManagement } from '@/hooks/useRatingsManagement';
import { UserRole, Rating } from '@/types';

// Mock dependencies
jest.mock('@/store/authStore');
jest.mock('@/hooks/useRatingsManagement');
jest.mock('next/dynamic', () => (fn: any) => {
  const Component = fn();
  return Component;
});

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;
const mockUseRatingsManagement = useRatingsManagement as jest.MockedFunction<typeof useRatingsManagement>;

// Mock dynamic components
jest.mock('../RatingsStats', () => {
  return function MockedRatingsStats({ operatorStats }: any) {
    return (
      <div data-testid="ratings-stats" data-stats={JSON.stringify(operatorStats)}>
        Mocked Ratings Stats
      </div>
    );
  };
});

jest.mock('../RatingsFilter', () => {
  return function MockedRatingsFilter({
    minRating,
    maxRating,
    isVisibleFilter,
    searchQuery,
    onMinRatingChange,
    onMaxRatingChange,
    onVisibilityFilterChange,
    onSearchQueryChange
  }: any) {
    return (
      <div data-testid="ratings-filter">
        <input
          data-testid="min-rating"
          value={minRating}
          onChange={(e) => onMinRatingChange(Number(e.target.value))}
        />
        <input
          data-testid="max-rating"
          value={maxRating}
          onChange={(e) => onMaxRatingChange(Number(e.target.value))}
        />
        <input
          type="checkbox"
          data-testid="visibility-filter"
          checked={isVisibleFilter}
          onChange={(e) => onVisibilityFilterChange(e.target.checked)}
        />
        <input
          data-testid="search-query"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
        />
      </div>
    );
  };
});

jest.mock('../RatingsList', () => {
  return function MockedRatingsList({ ratings, userRole, onHideRating }: any) {
    return (
      <div data-testid="ratings-list" data-user-role={userRole}>
        {ratings.map((rating: Rating) => (
          <div key={rating._id} data-testid={`rating-${rating._id}`}>
            <span>{rating.comment}</span>
            <button onClick={() => onHideRating(rating)}>Hide Rating</button>
          </div>
        ))}
      </div>
    );
  };
});

jest.mock('../CreateRatingForm', () => {
  return function MockedCreateRatingForm({ onSubmit, onClose, open }: any) {
    if (!open) return null;
    return (
      <div data-testid="create-rating-form">
        <button onClick={() => onSubmit({ rating: 5, comment: 'Test rating' })}>
          Submit Rating
        </button>
        <button onClick={onClose}>Close Form</button>
      </div>
    );
  };
});

jest.mock('../HideRatingForm', () => {
  return function MockedHideRatingForm({ onSubmit, onClose }: any) {
    return (
      <div data-testid="hide-rating-form">
        <button onClick={() => onSubmit({ reason: 'Test reason' })}>
          Submit Hide
        </button>
        <button onClick={onClose}>Close Hide Form</button>
      </div>
    );
  };
});

describe('RatingsManagement', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let mockHook: {
    ratings: Rating[];
    operatorStats: any;
    loading: boolean;
    error: string | null;
    currentPage: number;
    totalPages: number;
    minRating: number;
    maxRating: number;
    isVisibleFilter: boolean;
    searchQuery: string;
    canManageRatings: boolean;
    canViewRatings: boolean;
    setCurrentPage: jest.Mock;
    setMinRating: jest.Mock;
    setMaxRating: jest.Mock;
    setIsVisibleFilter: jest.Mock;
    setSearchQuery: jest.Mock;
    setError: jest.Mock;
    createRating: jest.Mock;
    hideRating: jest.Mock;
  };

  const mockRatings: Rating[] = [
    {
      _id: 'rating-1',
      rating: 5,
      comment: 'Excellent service',
      userId: 'user-1',
      operatorId: 'operator-1',
      isVisible: true,
      isHidden: false,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      user: {
        _id: 'user-1',
        profile: { fullName: 'John Doe', username: 'johndoe' }
      },
      operator: {
        _id: 'operator-1',
        profile: { fullName: 'Jane Operator', username: 'janeop' }
      }
    },
    {
      _id: 'rating-2',
      rating: 3,
      comment: 'Average service',
      userId: 'user-2',
      operatorId: 'operator-1',
      isVisible: true,
      isHidden: false,
      createdAt: new Date('2024-01-02T00:00:00.000Z'),
      user: {
        _id: 'user-2',
        profile: { fullName: 'Bob User', username: 'bobuser' }
      },
      operator: {
        _id: 'operator-1',
        profile: { fullName: 'Jane Operator', username: 'janeop' }
      }
    }
  ];

  const mockOperatorStats = {
    averageRating: 4.0,
    totalRatings: 15,
    distribution: {
      1: 1,
      2: 2,
      3: 3,
      4: 4,
      5: 5
    }
  };

  beforeEach(() => {
    user = userEvent.setup();
    
    mockHook = {
      ratings: mockRatings,
      operatorStats: mockOperatorStats,
      loading: false,
      error: null,
      currentPage: 1,
      totalPages: 2,
      minRating: 1,
      maxRating: 5,
      isVisibleFilter: true,
      searchQuery: '',
      canManageRatings: true,
      canViewRatings: true,
      setCurrentPage: jest.fn(),
      setMinRating: jest.fn(),
      setMaxRating: jest.fn(),
      setIsVisibleFilter: jest.fn(),
      setSearchQuery: jest.fn(),
      setError: jest.fn(),
      createRating: jest.fn(),
      hideRating: jest.fn()
    };

    mockUseRatingsManagement.mockReturnValue(mockHook);
    
    jest.clearAllMocks();
  });

  describe('User Role: Visitor', () => {
    beforeEach(() => {
      mockUseAuthStore.mockReturnValue({
        user: {
          id: 'visitor-123',
          email: 'visitor@example.com',
          role: UserRole.VISITOR,
          profile: { username: 'visitor', fullName: 'Visitor User' }
        }
      });
    });

    test('renders visitor interface correctly', () => {
      render(<RatingsManagement />);

      expect(screen.getByText('Мои оценки')).toBeInTheDocument();
      expect(screen.getByText('Оставить оценку')).toBeInTheDocument();
      expect(screen.getByTestId('ratings-list')).toBeInTheDocument();
    });

    test('shows create rating button for visitors', () => {
      render(<RatingsManagement />);

      const createButton = screen.getByText('Оставить оценку');
      expect(createButton).toBeInTheDocument();
      expect(createButton).toHaveClass('bg-yellow-500');
    });

    test('opens create rating form when button clicked', async () => {
      render(<RatingsManagement />);

      const createButton = screen.getByText('Оставить оценку');
      await user.click(createButton);

      expect(screen.getByTestId('create-rating-form')).toBeInTheDocument();
    });

    test('submits new rating successfully', async () => {
      render(<RatingsManagement />);

      const createButton = screen.getByText('Оставить оценку');
      await user.click(createButton);

      const submitButton = screen.getByText('Submit Rating');
      await user.click(submitButton);

      expect(mockHook.createRating).toHaveBeenCalledWith({
        rating: 5,
        comment: 'Test rating'
      });
    });

    test('closes create rating form after submission', async () => {
      render(<RatingsManagement />);

      const createButton = screen.getByText('Оставить оценку');
      await user.click(createButton);

      const submitButton = screen.getByText('Submit Rating');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByTestId('create-rating-form')).not.toBeInTheDocument();
      });
    });

    test('hides create button when showCreateForm is false', () => {
      render(<RatingsManagement showCreateForm={false} />);

      expect(screen.queryByText('Оставить оценку')).not.toBeInTheDocument();
    });

    test('hides create button when operatorId is provided', () => {
      render(<RatingsManagement operatorId="operator-1" />);

      expect(screen.queryByText('Оставить оценку')).not.toBeInTheDocument();
    });
  });

  describe('User Role: Admin/Operator', () => {
    beforeEach(() => {
      mockUseAuthStore.mockReturnValue({
        user: {
          id: 'admin-123',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
          profile: { username: 'admin', fullName: 'Admin User' }
        }
      });
    });

    test('renders admin interface correctly', () => {
      render(<RatingsManagement />);

      expect(screen.getByText('Управление оценками')).toBeInTheDocument();
      expect(screen.queryByText('Оставить оценку')).not.toBeInTheDocument();
      expect(screen.getByTestId('ratings-filter')).toBeInTheDocument();
    });

    test('shows ratings filter for admin users', () => {
      render(<RatingsManagement />);

      expect(screen.getByTestId('ratings-filter')).toBeInTheDocument();
      expect(screen.getByTestId('min-rating')).toBeInTheDocument();
      expect(screen.getByTestId('max-rating')).toBeInTheDocument();
      expect(screen.getByTestId('visibility-filter')).toBeInTheDocument();
      expect(screen.getByTestId('search-query')).toBeInTheDocument();
    });

    test('handles filter changes correctly', async () => {
      render(<RatingsManagement />);

      const minRatingInput = screen.getByTestId('min-rating');
      await user.clear(minRatingInput);
      await user.type(minRatingInput, '3');

      expect(mockHook.setMinRating).toHaveBeenCalledWith(3);
    });

    test('can hide ratings as admin', async () => {
      render(<RatingsManagement />);

      const hideButton = screen.getAllByText('Hide Rating')[0];
      await user.click(hideButton);

      expect(screen.getByTestId('hide-rating-form')).toBeInTheDocument();
    });

    test('submits hide rating form successfully', async () => {
      render(<RatingsManagement />);

      const hideButton = screen.getAllByText('Hide Rating')[0];
      await user.click(hideButton);

      const submitHideButton = screen.getByText('Submit Hide');
      await user.click(submitHideButton);

      expect(mockHook.hideRating).toHaveBeenCalledWith('rating-1', { reason: 'Test reason' });
    });
  });

  describe('Operator-specific view', () => {
    beforeEach(() => {
      mockUseAuthStore.mockReturnValue({
        user: {
          id: 'admin-123',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
          profile: { username: 'admin', fullName: 'Admin User' }
        }
      });
    });

    test('shows operator-specific title when operatorId provided', () => {
      render(<RatingsManagement operatorId="operator-1" />);

      expect(screen.getByText('Оценки оператора')).toBeInTheDocument();
    });

    test('displays operator stats when available', () => {
      render(<RatingsManagement operatorId="operator-1" />);

      expect(screen.getByTestId('ratings-stats')).toBeInTheDocument();
      const statsComponent = screen.getByTestId('ratings-stats');
      expect(statsComponent).toHaveAttribute('data-stats', JSON.stringify(mockOperatorStats));
    });

    test('hides filter when viewing specific operator', () => {
      render(<RatingsManagement operatorId="operator-1" />);

      expect(screen.queryByTestId('ratings-filter')).not.toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    test('shows pagination when multiple pages exist', () => {
      render(<RatingsManagement />);

      expect(screen.getByText('Назад')).toBeInTheDocument();
      expect(screen.getByText('Вперед')).toBeInTheDocument();
      expect(screen.getByText('Страница 1 из 2')).toBeInTheDocument();
    });

    test('disables previous button on first page', () => {
      render(<RatingsManagement />);

      const prevButton = screen.getByText('Назад');
      expect(prevButton).toBeDisabled();
    });

    test('enables next button when not on last page', () => {
      render(<RatingsManagement />);

      const nextButton = screen.getByText('Вперед');
      expect(nextButton).not.toBeDisabled();
    });

    test('handles page navigation correctly', async () => {
      render(<RatingsManagement />);

      const nextButton = screen.getByText('Вперед');
      await user.click(nextButton);

      expect(mockHook.setCurrentPage).toHaveBeenCalledWith(expect.any(Function));
    });

    test('hides pagination when only one page', () => {
      mockHook.totalPages = 1;
      mockUseRatingsManagement.mockReturnValue(mockHook);

      render(<RatingsManagement />);

      expect(screen.queryByText('Назад')).not.toBeInTheDocument();
      expect(screen.queryByText('Вперед')).not.toBeInTheDocument();
    });
  });

  describe('Loading and Error States', () => {
    test('shows loading state when data is loading', () => {
      mockHook.loading = true;
      mockHook.ratings = [];
      mockUseRatingsManagement.mockReturnValue(mockHook);

      render(<RatingsManagement />);

      expect(screen.getByText('Загрузка...')).toBeInTheDocument();
    });

    test('shows error message when error exists', () => {
      mockHook.error = 'Failed to load ratings';
      mockUseRatingsManagement.mockReturnValue(mockHook);

      render(<RatingsManagement />);

      expect(screen.getByText('Failed to load ratings')).toBeInTheDocument();
      const errorDiv = screen.getByText('Failed to load ratings').closest('div');
      expect(errorDiv).toHaveClass('bg-red-100', 'border-red-400', 'text-red-700');
    });

    test('does not show loading when ratings exist', () => {
      mockHook.loading = true;
      mockUseRatingsManagement.mockReturnValue(mockHook);

      render(<RatingsManagement />);

      expect(screen.queryByText('Загрузка...')).not.toBeInTheDocument();
    });
  });

  describe('Ratings Display', () => {
    test('displays ratings list correctly', () => {
      render(<RatingsManagement />);

      expect(screen.getByTestId('ratings-list')).toBeInTheDocument();
      expect(screen.getByTestId('rating-rating-1')).toBeInTheDocument();
      expect(screen.getByTestId('rating-rating-2')).toBeInTheDocument();
      expect(screen.getByText('Excellent service')).toBeInTheDocument();
      expect(screen.getByText('Average service')).toBeInTheDocument();
    });

    test('passes correct user role to ratings list', () => {
      mockUseAuthStore.mockReturnValue({
        user: {
          id: 'admin-123',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
          profile: { username: 'admin', fullName: 'Admin User' }
        }
      });

      render(<RatingsManagement />);

      const ratingsList = screen.getByTestId('ratings-list');
      expect(ratingsList).toHaveAttribute('data-user-role', UserRole.ADMIN);
    });
  });

  describe('Form Interactions', () => {
    beforeEach(() => {
      mockUseAuthStore.mockReturnValue({
        user: {
          id: 'visitor-123',
          email: 'visitor@example.com',
          role: UserRole.VISITOR,
          profile: { username: 'visitor', fullName: 'Visitor User' }
        }
      });
    });

    test('closes create form when close button clicked', async () => {
      render(<RatingsManagement />);

      const createButton = screen.getByText('Оставить оценку');
      await user.click(createButton);

      const closeButton = screen.getByText('Close Form');
      await user.click(closeButton);

      expect(screen.queryByTestId('create-rating-form')).not.toBeInTheDocument();
    });

    test('closes hide form when close button clicked', async () => {
      mockUseAuthStore.mockReturnValue({
        user: {
          id: 'admin-123',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
          profile: { username: 'admin', fullName: 'Admin User' }
        }
      });

      render(<RatingsManagement />);

      const hideButton = screen.getAllByText('Hide Rating')[0];
      await user.click(hideButton);

      const closeHideButton = screen.getByText('Close Hide Form');
      await user.click(closeHideButton);

      expect(screen.queryByTestId('hide-rating-form')).not.toBeInTheDocument();
    });

    test('resets selected rating when hide form is closed', async () => {
      mockUseAuthStore.mockReturnValue({
        user: {
          id: 'admin-123',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
          profile: { username: 'admin', fullName: 'Admin User' }
        }
      });

      render(<RatingsManagement />);

      const hideButton = screen.getAllByText('Hide Rating')[0];
      await user.click(hideButton);

      const submitHideButton = screen.getByText('Submit Hide');
      await user.click(submitHideButton);

      await waitFor(() => {
        expect(screen.queryByTestId('hide-rating-form')).not.toBeInTheDocument();
      });
    });
  });

  describe('Permissions and Access Control', () => {
    test('shows appropriate interface for different user roles', () => {
      const testCases = [
        {
          role: UserRole.VISITOR,
          expectedTitle: 'Мои оценки',
          showCreateButton: true,
          showFilter: false
        },
        {
          role: UserRole.OPERATOR,
          expectedTitle: 'Управление оценками',
          showCreateButton: false,
          showFilter: true
        },
        {
          role: UserRole.ADMIN,
          expectedTitle: 'Управление оценками',
          showCreateButton: false,
          showFilter: true
        }
      ];

      testCases.forEach(({ role, expectedTitle, showCreateButton, showFilter }) => {
        mockUseAuthStore.mockReturnValue({
          user: {
            id: 'user-123',
            email: 'user@example.com',
            role: role,
            profile: { username: 'user', fullName: 'Test User' }
          }
        });

        const { unmount } = render(<RatingsManagement />);

        expect(screen.getByText(expectedTitle)).toBeInTheDocument();
        
        if (showCreateButton) {
          expect(screen.getByText('Оставить оценку')).toBeInTheDocument();
        } else {
          expect(screen.queryByText('Оставить оценку')).not.toBeInTheDocument();
        }

        if (showFilter) {
          expect(screen.getByTestId('ratings-filter')).toBeInTheDocument();
        } else {
          expect(screen.queryByTestId('ratings-filter')).not.toBeInTheDocument();
        }

        unmount();
      });
    });
  });

  describe('Hook Integration', () => {
    test('calls useRatingsManagement with correct parameters', () => {
      render(<RatingsManagement operatorId="operator-1" userRole={UserRole.ADMIN} />);

      expect(mockUseRatingsManagement).toHaveBeenCalledWith({
        operatorId: 'operator-1',
        userRole: UserRole.ADMIN
      });
    });

    test('uses user role from auth store when userRole prop not provided', () => {
      mockUseAuthStore.mockReturnValue({
        user: {
          id: 'user-123',
          email: 'user@example.com',
          role: UserRole.VISITOR,
          profile: { username: 'user', fullName: 'Test User' }
        }
      });

      render(<RatingsManagement />);

      expect(mockUseRatingsManagement).toHaveBeenCalledWith({
        operatorId: undefined,
        userRole: UserRole.VISITOR
      });
    });
  });

  describe('Error Handling', () => {
    test('handles create rating errors gracefully', async () => {
      mockHook.createRating.mockRejectedValue(new Error('Create failed'));
      mockUseRatingsManagement.mockReturnValue(mockHook);

      mockUseAuthStore.mockReturnValue({
        user: {
          id: 'visitor-123',
          email: 'visitor@example.com',
          role: UserRole.VISITOR,
          profile: { username: 'visitor', fullName: 'Visitor User' }
        }
      });

      render(<RatingsManagement />);

      const createButton = screen.getByText('Оставить оценку');
      await user.click(createButton);

      const submitButton = screen.getByText('Submit Rating');
      await user.click(submitButton);

      // Form should remain open on error
      expect(screen.getByTestId('create-rating-form')).toBeInTheDocument();
    });

    test('handles hide rating errors gracefully', async () => {
      mockHook.hideRating.mockRejectedValue(new Error('Hide failed'));
      mockUseRatingsManagement.mockReturnValue(mockHook);

      mockUseAuthStore.mockReturnValue({
        user: {
          id: 'admin-123',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
          profile: { username: 'admin', fullName: 'Admin User' }
        }
      });

      render(<RatingsManagement />);

      const hideButton = screen.getAllByText('Hide Rating')[0];
      await user.click(hideButton);

      const submitHideButton = screen.getByText('Submit Hide');
      await user.click(submitHideButton);

      // Form should remain open on error
      expect(screen.getByTestId('hide-rating-form')).toBeInTheDocument();
    });
  });
});