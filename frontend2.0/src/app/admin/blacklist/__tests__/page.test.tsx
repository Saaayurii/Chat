import { render, screen, waitFor } from '@/test-utils';
import BlacklistPage from '../page';

// Mock the BlacklistManagement component
jest.mock('@/components/Blacklist/BlacklistManagement', () => {
  return function MockBlacklistManagement() {
    return <div data-testid="blacklist-management">Blacklist Management Component</div>;
  };
});

// Mock the auth store
jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(() => ({
    user: { role: 'ADMIN' },
    isLoading: false,
  })),
}));

describe('Blacklist Page', () => {
  it('renders blacklist management component', async () => {
    render(<BlacklistPage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('blacklist-management')).toBeInTheDocument();
    });
  });

  it('displays page title', async () => {
    render(<BlacklistPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Blacklist Management Component')).toBeInTheDocument();
    });
  });
});