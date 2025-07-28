import { render, screen, fireEvent, waitFor } from '@/test-utils';
import BlacklistManagement from '../BlacklistManagement';
import { mockBlacklistEntry } from '@/test-utils/mocks';

// Mock the useApiCall hook
jest.mock('@/hooks/useApiCall', () => ({
  useApiCall: jest.fn(() => ({
    execute: jest.fn(),
    loading: false,
    error: null,
    data: null,
  })),
}));

describe('BlacklistManagement Component', () => {
  it('renders blacklist table', () => {
    render(<BlacklistManagement />);
    
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('displays add new entry button', () => {
    render(<BlacklistManagement />);
    
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
  });

  it('shows loading state', () => {
    const mockUseApiCall = require('@/hooks/useApiCall').useApiCall;
    mockUseApiCall.mockReturnValue({
      execute: jest.fn(),
      loading: true,
      error: null,
      data: null,
    });

    render(<BlacklistManagement />);
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays error message when there is an error', () => {
    const mockUseApiCall = require('@/hooks/useApiCall').useApiCall;
    mockUseApiCall.mockReturnValue({
      execute: jest.fn(),
      loading: false,
      error: 'Failed to load blacklist',
      data: null,
    });

    render(<BlacklistManagement />);
    
    expect(screen.getByText('Failed to load blacklist')).toBeInTheDocument();
  });

  it('renders blacklist entries when data is available', () => {
    const mockEntries = [
      mockBlacklistEntry({ _id: '1' }),
      mockBlacklistEntry({ _id: '2' }),
    ];

    const mockUseApiCall = require('@/hooks/useApiCall').useApiCall;
    mockUseApiCall.mockReturnValue({
      execute: jest.fn(),
      loading: false,
      error: null,
      data: { data: mockEntries },
    });

    render(<BlacklistManagement />);
    
    expect(screen.getByText('test1@example.com')).toBeInTheDocument();
    expect(screen.getByText('test2@example.com')).toBeInTheDocument();
  });

  it('handles add entry button click', () => {
    render(<BlacklistManagement />);
    
    const addButton = screen.getByRole('button', { name: /add/i });
    fireEvent.click(addButton);
    
    // Should open modal or form
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('handles delete entry', async () => {
    const mockEntries = [
      mockBlacklistEntry({ _id: '1' }),
    ];

    const mockExecute = jest.fn();
    const mockUseApiCall = require('@/hooks/useApiCall').useApiCall;
    mockUseApiCall.mockReturnValue({
      execute: mockExecute,
      loading: false,
      error: null,
      data: { data: mockEntries },
    });

    render(<BlacklistManagement />);
    
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);
    
    await waitFor(() => {
      expect(mockExecute).toHaveBeenCalled();
    });
  });

  it('handles search functionality', () => {
    render(<BlacklistManagement />);
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'test@example.com' } });
    
    expect(searchInput).toHaveValue('test@example.com');
  });

  it('handles pagination', () => {
    const mockEntries = Array.from({ length: 20 }, (_, i) => 
      mockBlacklistEntry({ _id: `${i + 1}` })
    );

    const mockUseApiCall = require('@/hooks/useApiCall').useApiCall;
    mockUseApiCall.mockReturnValue({
      execute: jest.fn(),
      loading: false,
      error: null,
      data: { data: mockEntries, total: 20 },
    });

    render(<BlacklistManagement />);
    
    // Should show pagination controls
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
  });
});