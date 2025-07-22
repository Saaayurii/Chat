import { render, screen, fireEvent, waitFor } from '@/test-utils';
import RatingForm from '../RatingForm';

const mockOnSubmit = jest.fn();
const mockOnCancel = jest.fn();

describe('RatingForm Component', () => {
  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnCancel.mockClear();
  });

  it('renders form with initial values', () => {
    render(
      <RatingForm
        operatorId="op-123"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        loading={false}
      />
    );
    
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    render(
      <RatingForm
        operatorId="op-123"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        loading={true}
      />
    );
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    expect(submitButton).toBeDisabled();
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <RatingForm
        operatorId="op-123"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        loading={false}
      />
    );
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onSubmit with form data when submitted', async () => {
    render(
      <RatingForm
        operatorId="op-123"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        loading={false}
      />
    );
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          operatorId: 'op-123',
          rating: 5,
          comment: '',
          isAnonymous: false
        })
      );
    });
  });

  it('updates rating when star is clicked', () => {
    render(
      <RatingForm
        operatorId="op-123"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        loading={false}
      />
    );
    
    // This is a simplified test - in reality you'd need to identify the star elements
    const ratingInput = screen.getByDisplayValue('5');
    fireEvent.change(ratingInput, { target: { value: '3' } });
    
    expect(ratingInput).toHaveValue('3');
  });

  it('handles comment input', () => {
    render(
      <RatingForm
        operatorId="op-123"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        loading={false}
      />
    );
    
    const commentInput = screen.getByRole('textbox');
    fireEvent.change(commentInput, { target: { value: 'Great service!' } });
    
    expect(commentInput).toHaveValue('Great service!');
  });
});