import { render, screen, waitFor } from '@/test-utils';
import ComplaintsPage from '../page';
import { UserRole } from '@/types';

// Mock the ComplaintsManagement component
jest.mock('@/components/Complaints/ComplaintsManagement', () => {
  return function MockComplaintsManagement() {
    return <div data-testid="complaints-management">Complaints Management Component</div>;
  };
});

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock the auth store
jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(() => ({
    user: { role: 'admin' as any },
    isLoading: false,
  })),
}));

describe('Complaints Page', () => {
  it('renders complaints management component', async () => {
    render(<ComplaintsPage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('complaints-management')).toBeInTheDocument();
    });
  });

  it('displays page content', async () => {
    render(<ComplaintsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Complaints Management Component')).toBeInTheDocument();
    });
  });
});