import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import UserRatingsPage from '../page';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types';

// Mock dependencies
jest.mock('next/navigation');
jest.mock('@/store/authStore');
jest.mock('@/components/Ratings/RatingsManagement', () => {
  return function MockedRatingsManagement({ userRole }: { userRole: UserRole }) {
    return (
      <div data-testid="ratings-management" data-user-role={userRole}>
        Mocked Ratings Management Component
      </div>
    );
  };
});

const mockPush = jest.fn();
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

(useRouter as jest.Mock).mockReturnValue({
  push: mockPush,
});

describe('UserRatingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication and Authorization', () => {
    test('redirects to login when user is not authenticated', async () => {
      mockUseAuthStore.mockReturnValue({
        user: null,
        isLoading: false
      });

      render(<UserRatingsPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    test('redirects to login when user is not a visitor', async () => {
      mockUseAuthStore.mockReturnValue({
        user: {
          id: 'admin-123',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
          profile: {
            username: 'admin',
            fullName: 'Admin User'
          }
        },
        isLoading: false
      });

      render(<UserRatingsPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    test('allows access for visitor users', async () => {
      mockUseAuthStore.mockReturnValue({
        user: {
          id: 'visitor-123',
          email: 'visitor@example.com',
          role: UserRole.VISITOR,
          profile: {
            username: 'visitor',
            fullName: 'Visitor User'
          }
        },
        isLoading: false
      });

      render(<UserRatingsPage />);

      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalled();
        expect(screen.getByTestId('ratings-management')).toBeInTheDocument();
      });
    });

    test('does not redirect while loading', () => {
      mockUseAuthStore.mockReturnValue({
        user: null,
        isLoading: true
      });

      render(<UserRatingsPage />);

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    test('shows loading state when auth is loading', () => {
      mockUseAuthStore.mockReturnValue({
        user: null,
        isLoading: true
      });

      render(<UserRatingsPage />);

      expect(screen.getByText('Загрузка...')).toBeInTheDocument();
      expect(screen.getByText('Загрузка...')).toHaveClass('flex', 'justify-center', 'items-center', 'min-h-screen', 'bg-background', 'text-muted-foreground');
    });

    test('does not show loading when auth is complete', async () => {
      mockUseAuthStore.mockReturnValue({
        user: {
          id: 'visitor-123',
          email: 'visitor@example.com',
          role: UserRole.VISITOR,
          profile: {
            username: 'visitor',
            fullName: 'Visitor User'
          }
        },
        isLoading: false
      });

      render(<UserRatingsPage />);

      await waitFor(() => {
        expect(screen.queryByText('Загрузка...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Page Rendering', () => {
    test('renders page with proper layout for authorized visitor', async () => {
      mockUseAuthStore.mockReturnValue({
        user: {
          id: 'visitor-123',
          email: 'visitor@example.com',
          role: UserRole.VISITOR,
          profile: {
            username: 'visitor',
            fullName: 'Visitor User'
          }
        },
        isLoading: false
      });

      render(<UserRatingsPage />);

      await waitFor(() => {
        const container = screen.getByTestId('ratings-management').closest('.min-h-screen');
        expect(container).toHaveClass('min-h-screen', 'bg-background');
        
        const innerContainer = screen.getByTestId('ratings-management').closest('.container');
        expect(innerContainer).toHaveClass('container', 'mx-auto', 'px-4', 'py-8');
      });
    });

    test('passes correct user role to RatingsManagement component', async () => {
      mockUseAuthStore.mockReturnValue({
        user: {
          id: 'visitor-123',
          email: 'visitor@example.com',
          role: UserRole.VISITOR,
          profile: {
            username: 'visitor',
            fullName: 'Visitor User'
          }
        },
        isLoading: false
      });

      render(<UserRatingsPage />);

      await waitFor(() => {
        const ratingsComponent = screen.getByTestId('ratings-management');
        expect(ratingsComponent).toHaveAttribute('data-user-role', UserRole.VISITOR);
      });
    });

    test('renders RatingsManagement component', async () => {
      mockUseAuthStore.mockReturnValue({
        user: {
          id: 'visitor-123',
          email: 'visitor@example.com',
          role: UserRole.VISITOR,
          profile: {
            username: 'visitor',
            fullName: 'Visitor User'
          }
        },
        isLoading: false
      });

      render(<UserRatingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Mocked Ratings Management Component')).toBeInTheDocument();
      });
    });
  });

  describe('Security and Access Control', () => {
    test('returns null for unauthorized users after loading', async () => {
      mockUseAuthStore.mockReturnValue({
        user: {
          id: 'operator-123',
          email: 'operator@example.com',
          role: UserRole.OPERATOR,
          profile: {
            username: 'operator',
            fullName: 'Operator User'
          }
        },
        isLoading: false
      });

      const { container } = render(<UserRatingsPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });

      // Component should return null for unauthorized users
      expect(container.firstChild).toBeNull();
    });

    test('prevents access for admin users', async () => {
      mockUseAuthStore.mockReturnValue({
        user: {
          id: 'admin-123',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
          profile: {
            username: 'admin',
            fullName: 'Admin User'
          }
        },
        isLoading: false
      });

      render(<UserRatingsPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    test('prevents access for operator users', async () => {
      mockUseAuthStore.mockReturnValue({
        user: {
          id: 'operator-123',
          email: 'operator@example.com',
          role: UserRole.OPERATOR,
          profile: {
            username: 'operator',
            fullName: 'Operator User'
          }
        },
        isLoading: false
      });

      render(<UserRatingsPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('User Role Validation', () => {
    test('validates user role is exactly VISITOR', async () => {
      // Test with all possible roles
      const testCases = [
        { role: UserRole.ADMIN, shouldRedirect: true },
        { role: UserRole.OPERATOR, shouldRedirect: true },
        { role: UserRole.VISITOR, shouldRedirect: false },
      ];

      for (const testCase of testCases) {
        jest.clearAllMocks();

        mockUseAuthStore.mockReturnValue({
          user: {
            id: 'user-123',
            email: 'user@example.com',
            role: testCase.role,
            profile: {
              username: 'user',
              fullName: 'Test User'
            }
          },
          isLoading: false
        });

        render(<UserRatingsPage />);

        await waitFor(() => {
          if (testCase.shouldRedirect) {
            expect(mockPush).toHaveBeenCalledWith('/login');
          } else {
            expect(mockPush).not.toHaveBeenCalled();
            expect(screen.getByTestId('ratings-management')).toBeInTheDocument();
          }
        });
      }
    });
  });

  describe('Component Lifecycle', () => {
    test('handles auth state changes correctly', async () => {
      // Start with loading state
      const { rerender } = render(<UserRatingsPage />);
      
      mockUseAuthStore.mockReturnValue({
        user: null,
        isLoading: true
      });
      
      rerender(<UserRatingsPage />);
      expect(screen.getByText('Загрузка...')).toBeInTheDocument();

      // Change to authenticated visitor
      mockUseAuthStore.mockReturnValue({
        user: {
          id: 'visitor-123',
          email: 'visitor@example.com',
          role: UserRole.VISITOR,
          profile: {
            username: 'visitor',
            fullName: 'Visitor User'
          }
        },
        isLoading: false
      });

      rerender(<UserRatingsPage />);

      await waitFor(() => {
        expect(screen.queryByText('Загрузка...')).not.toBeInTheDocument();
        expect(screen.getByTestId('ratings-management')).toBeInTheDocument();
      });
    });

    test('redirects immediately when auth completes with wrong role', async () => {
      mockUseAuthStore.mockReturnValue({
        user: null,
        isLoading: true
      });

      const { rerender } = render(<UserRatingsPage />);

      // Auth completes with admin user
      mockUseAuthStore.mockReturnValue({
        user: {
          id: 'admin-123',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
          profile: {
            username: 'admin',
            fullName: 'Admin User'
          }
        },
        isLoading: false
      });

      rerender(<UserRatingsPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Error Handling', () => {
    test('handles missing user profile gracefully', async () => {
      mockUseAuthStore.mockReturnValue({
        user: {
          id: 'visitor-123',
          email: 'visitor@example.com',
          role: UserRole.VISITOR,
          profile: null as any
        },
        isLoading: false
      });

      render(<UserRatingsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('ratings-management')).toBeInTheDocument();
      });
    });

    test('handles undefined user properties gracefully', async () => {
      mockUseAuthStore.mockReturnValue({
        user: {
          id: 'visitor-123',
          role: UserRole.VISITOR
        } as any,
        isLoading: false
      });

      render(<UserRatingsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('ratings-management')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper semantic structure', async () => {
      mockUseAuthStore.mockReturnValue({
        user: {
          id: 'visitor-123',
          email: 'visitor@example.com',
          role: UserRole.VISITOR,
          profile: {
            username: 'visitor',
            fullName: 'Visitor User'
          }
        },
        isLoading: false
      });

      render(<UserRatingsPage />);

      await waitFor(() => {
        const mainContainer = screen.getByTestId('ratings-management').closest('.min-h-screen');
        expect(mainContainer).toBeInTheDocument();
        
        const contentContainer = screen.getByTestId('ratings-management').closest('.container');
        expect(contentContainer).toBeInTheDocument();
      });
    });

    test('provides appropriate loading message', () => {
      mockUseAuthStore.mockReturnValue({
        user: null,
        isLoading: true
      });

      render(<UserRatingsPage />);

      const loadingElement = screen.getByText('Загрузка...');
      expect(loadingElement).toBeInTheDocument();
      expect(loadingElement).toHaveClass('text-muted-foreground');
    });
  });

  describe('Page Consistency', () => {
    test('maintains consistent styling with other user pages', async () => {
      mockUseAuthStore.mockReturnValue({
        user: {
          id: 'visitor-123',
          email: 'visitor@example.com',
          role: UserRole.VISITOR,
          profile: {
            username: 'visitor',
            fullName: 'Visitor User'
          }
        },
        isLoading: false
      });

      render(<UserRatingsPage />);

      await waitFor(() => {
        // Check that the page structure matches other user pages
        const pageContainer = screen.getByTestId('ratings-management').closest('.min-h-screen');
        expect(pageContainer).toHaveClass('min-h-screen', 'bg-background');
        
        const contentWrapper = screen.getByTestId('ratings-management').closest('.container');
        expect(contentWrapper).toHaveClass('container', 'mx-auto', 'px-4', 'py-8');
      });
    });

    test('follows same authorization pattern as other user pages', async () => {
      // Test that authorization logic is consistent
      const unauthorizedRoles = [UserRole.ADMIN, UserRole.OPERATOR];
      
      for (const role of unauthorizedRoles) {
        jest.clearAllMocks();
        
        mockUseAuthStore.mockReturnValue({
          user: {
            id: 'user-123',
            email: 'user@example.com',
            role: role,
            profile: {
              username: 'user',
              fullName: 'Test User'
            }
          },
          isLoading: false
        });

        render(<UserRatingsPage />);

        await waitFor(() => {
          expect(mockPush).toHaveBeenCalledWith('/login');
        });
      }
    });
  });

  describe('Integration', () => {
    test('integrates properly with auth store', async () => {
      // Test different auth states
      const authStates = [
        { user: null, isLoading: true, expectLoading: true },
        { user: null, isLoading: false, expectRedirect: true },
        { 
          user: { 
            id: 'visitor-123', 
            role: UserRole.VISITOR,
            email: 'visitor@example.com',
            profile: { username: 'visitor', fullName: 'Visitor' }
          }, 
          isLoading: false, 
          expectContent: true 
        }
      ];

      for (const authState of authStates) {
        jest.clearAllMocks();
        
        mockUseAuthStore.mockReturnValue(authState);

        render(<UserRatingsPage />);

        if (authState.expectLoading) {
          expect(screen.getByText('Загрузка...')).toBeInTheDocument();
        } else if (authState.expectRedirect) {
          await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/login');
          });
        } else if (authState.expectContent) {
          await waitFor(() => {
            expect(screen.getByTestId('ratings-management')).toBeInTheDocument();
          });
        }
      }
    });
  });

  describe('User Experience', () => {
    test('provides consistent user experience across page states', async () => {
      // Test loading to content transition
      mockUseAuthStore.mockReturnValue({
        user: null,
        isLoading: true
      });

      const { rerender } = render(<UserRatingsPage />);
      
      expect(screen.getByText('Загрузка...')).toBeInTheDocument();

      // Simulate auth completion
      mockUseAuthStore.mockReturnValue({
        user: {
          id: 'visitor-123',
          email: 'visitor@example.com',
          role: UserRole.VISITOR,
          profile: {
            username: 'visitor',
            fullName: 'Visitor User'
          }
        },
        isLoading: false
      });

      rerender(<UserRatingsPage />);

      await waitFor(() => {
        expect(screen.queryByText('Загрузка...')).not.toBeInTheDocument();
        expect(screen.getByTestId('ratings-management')).toBeInTheDocument();
      });
    });

    test('handles rapid auth state changes without errors', async () => {
      const { rerender } = render(<UserRatingsPage />);

      // Rapidly change auth states
      const states = [
        { user: null, isLoading: true },
        { user: null, isLoading: false },
        { user: { id: 'visitor-123', role: UserRole.VISITOR, email: 'visitor@example.com', profile: { username: 'visitor', fullName: 'Visitor' } }, isLoading: false },
        { user: null, isLoading: true },
      ];

      for (const state of states) {
        mockUseAuthStore.mockReturnValue(state);
        rerender(<UserRatingsPage />);
      }

      // Should handle state changes gracefully without throwing errors
      expect(screen.getByText('Загрузка...')).toBeInTheDocument();
    });
  });
});