import { render, screen, waitFor } from '@/test-utils';
import ComplaintsPage from '../page';

// Mock the ComplaintsManagement component
jest.mock('@/components/Complaints/ComplaintsManagement', () => {
  return function MockComplaintsManagement() {
    return <div data-testid="complaints-management">Complaints Management Component</div>;
  };
});

// Mock the auth store
jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(() => ({
    user: { role: 'ADMIN' },
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