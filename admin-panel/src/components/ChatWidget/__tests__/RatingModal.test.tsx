import { render, screen, fireEvent } from '@/test-utils';
import RatingModal from '../RatingModal';

const mockOnClose = jest.fn();
const mockOnSubmit = jest.fn();

describe('RatingModal Component', () => {
  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnSubmit.mockClear();
  });

  it('renders when isOpen is true', () => {
    render(
      <RatingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    expect(screen.getByText('Оценить работу оператора')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <RatingModal
        isOpen={false}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    expect(screen.queryByText('Оценить работу оператора')).not.toBeInTheDocument();
  });

  it('displays default operator name', () => {
    render(
      <RatingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    expect(screen.getByText(/Оцените качество обслуживания оператора Оператор/)).toBeInTheDocument();
  });

  it('displays custom operator name', () => {
    render(
      <RatingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        operatorName="John Doe"
      />
    );
    
    expect(screen.getByText(/Оцените качество обслуживания оператора John Doe/)).toBeInTheDocument();
  });

  it('renders 5 star rating buttons', () => {
    render(
      <RatingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    const starButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg')
    );
    
    // 5 stars + close button + cancel button + submit button = 8 buttons
    expect(starButtons.length).toBeGreaterThanOrEqual(5);
  });

  it('shows initial rating text', () => {
    render(
      <RatingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    expect(screen.getByText('Выберите оценку')).toBeInTheDocument();
  });

  it('updates rating when star is clicked', () => {
    render(
      <RatingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    const starButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg') && button.querySelector('svg')?.classList.contains('lucide-star')
    );
    
    // Click the third star
    fireEvent.click(starButtons[2]);
    
    expect(screen.getByText('Нормально')).toBeInTheDocument();
  });

  it('shows correct rating text for each star', () => {
    const { rerender } = render(
      <RatingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    const starButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg') && button.querySelector('svg')?.classList.contains('lucide-star')
    );
    
    // Test each rating
    fireEvent.click(starButtons[0]);
    expect(screen.getByText('Очень плохо')).toBeInTheDocument();
    
    fireEvent.click(starButtons[1]);
    expect(screen.getByText('Плохо')).toBeInTheDocument();
    
    fireEvent.click(starButtons[2]);
    expect(screen.getByText('Нормально')).toBeInTheDocument();
    
    fireEvent.click(starButtons[3]);
    expect(screen.getByText('Хорошо')).toBeInTheDocument();
    
    fireEvent.click(starButtons[4]);
    expect(screen.getByText('Отлично')).toBeInTheDocument();
  });

  it('handles comment input', () => {
    render(
      <RatingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    const commentTextarea = screen.getByPlaceholderText('Оставьте ваш отзыв о работе оператора...');
    fireEvent.change(commentTextarea, { target: { value: 'Great service!' } });
    
    expect(commentTextarea).toHaveValue('Great service!');
  });

  it('disables submit button when no rating is selected', () => {
    render(
      <RatingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    const submitButton = screen.getByText('Отправить оценку');
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when rating is selected', () => {
    render(
      <RatingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    const starButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg')
    );
    
    fireEvent.click(starButtons[2]);
    
    const submitButton = screen.getByText('Отправить оценку');
    expect(submitButton).not.toBeDisabled();
  });

  it('calls onSubmit with rating and comment when submitted', () => {
    render(
      <RatingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    const starButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg') && button.querySelector('svg')?.classList.contains('lucide-star')
    );
    
    fireEvent.click(starButtons[3]); // 4 stars
    
    const commentTextarea = screen.getByPlaceholderText('Оставьте ваш отзыв о работе оператора...');
    fireEvent.change(commentTextarea, { target: { value: 'Excellent service!' } });
    
    const submitButton = screen.getByText('Отправить оценку');
    fireEvent.click(submitButton);
    
    expect(mockOnSubmit).toHaveBeenCalledWith(4, 'Excellent service!');
  });

  it('calls onSubmit with rating only when no comment', () => {
    render(
      <RatingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    const starButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg') && button.querySelector('svg')?.classList.contains('lucide-star')
    );
    
    fireEvent.click(starButtons[4]); // 5 stars
    
    const submitButton = screen.getByText('Отправить оценку');
    fireEvent.click(submitButton);
    
    expect(mockOnSubmit).toHaveBeenCalledWith(5, '');
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <RatingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    const closeButton = screen.getAllByRole('button').find(button => 
      button.querySelector('svg')?.classList.contains('lucide-x')
    );
    fireEvent.click(closeButton!);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel button is clicked', () => {
    render(
      <RatingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    const cancelButton = screen.getByText('Отмена');
    fireEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('resets form after submission', () => {
    render(
      <RatingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    const starButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg')
    );
    
    fireEvent.click(starButtons[2]);
    
    const commentTextarea = screen.getByPlaceholderText('Оставьте ваш отзыв о работе оператора...');
    fireEvent.change(commentTextarea, { target: { value: 'Good service' } });
    
    const submitButton = screen.getByText('Отправить оценку');
    fireEvent.click(submitButton);
    
    // Form should be reset
    expect(screen.getByText('Выберите оценку')).toBeInTheDocument();
    expect(commentTextarea).toHaveValue('');
  });

  it('shows hover effect on stars', () => {
    render(
      <RatingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    const starButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg') && button.querySelector('svg')?.classList.contains('lucide-star')
    );
    
    fireEvent.mouseEnter(starButtons[2]);
    
    // Should show "Нормально" text on hover
    expect(screen.getByText('Нормально')).toBeInTheDocument();
  });

  it('resets hover state when mouse leaves', () => {
    render(
      <RatingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    const starButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg')
    );
    
    fireEvent.mouseEnter(starButtons[2]);
    fireEvent.mouseLeave(starButtons[2]);
    
    // Should return to initial state
    expect(screen.getByText('Выберите оценку')).toBeInTheDocument();
  });

  it('applies correct modal backdrop styling', () => {
    render(
      <RatingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    const backdrop = screen.getByText('Оценить работу оператора').closest('.fixed');
    expect(backdrop).toHaveClass(
      'fixed',
      'inset-0',
      'bg-black',
      'bg-opacity-50',
      'flex',
      'items-center',
      'justify-center',
      'z-50'
    );
  });

  it('applies correct card styling', () => {
    render(
      <RatingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    const card = screen.getByText('Оценить работу оператора').closest('.w-full');
    expect(card).toHaveClass('w-full', 'max-w-md', 'mx-4', 'bg-white');
  });
});