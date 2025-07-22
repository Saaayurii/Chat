import { render, screen, fireEvent } from '@/test-utils';
import ComplaintModal from '../ComplaintModal';

const mockOnClose = jest.fn();
const mockOnSubmit = jest.fn();

describe('ComplaintModal Component', () => {
  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnSubmit.mockClear();
  });

  it('renders when isOpen is true', () => {
    render(
      <ComplaintModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    expect(screen.getByText('Подать жалобу')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <ComplaintModal
        isOpen={false}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    expect(screen.queryByText('Подать жалобу')).not.toBeInTheDocument();
  });

  it('displays default operator name', () => {
    render(
      <ComplaintModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    expect(screen.getByText('Подать жалобу на оператора Оператор')).toBeInTheDocument();
  });

  it('displays custom operator name', () => {
    render(
      <ComplaintModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        operatorName="John Doe"
      />
    );
    
    expect(screen.getByText('Подать жалобу на оператора John Doe')).toBeInTheDocument();
  });

  it('renders reason select with all options', () => {
    render(
      <ComplaintModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    const select = screen.getByDisplayValue('Выберите причину...');
    expect(select).toBeInTheDocument();
    
    // Check that all complaint reasons are present
    expect(screen.getByText('Непrofessional поведение')).toBeInTheDocument();
    expect(screen.getByText('Грубое обращение')).toBeInTheDocument();
    expect(screen.getByText('Неверная информация')).toBeInTheDocument();
    expect(screen.getByText('Долгое время ответа')).toBeInTheDocument();
    expect(screen.getByText('Нерешенная проблема')).toBeInTheDocument();
    expect(screen.getByText('Технические проблемы')).toBeInTheDocument();
    expect(screen.getByText('Другое')).toBeInTheDocument();
  });

  it('handles reason selection', () => {
    render(
      <ComplaintModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    const select = screen.getByDisplayValue('Выберите причину...');
    fireEvent.change(select, { target: { value: 'rude_treatment' } });
    
    expect(select).toHaveValue('rude_treatment');
  });

  it('renders details textarea', () => {
    render(
      <ComplaintModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    const textarea = screen.getByPlaceholderText('Опишите подробно суть вашей жалобы...');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute('rows', '5');
  });

  it('handles details input', () => {
    render(
      <ComplaintModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    const textarea = screen.getByPlaceholderText('Опишите подробно суть вашей жалобы...');
    fireEvent.change(textarea, { target: { value: 'The operator was very rude' } });
    
    expect(textarea).toHaveValue('The operator was very rude');
  });

  it('disables submit button when form is incomplete', () => {
    render(
      <ComplaintModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    const submitButton = screen.getByText('Подать жалобу');
    expect(submitButton).toBeDisabled();
  });

  it('disables submit button when only reason is selected', () => {
    render(
      <ComplaintModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    const select = screen.getByDisplayValue('Выберите причину...');
    fireEvent.change(select, { target: { value: 'rude_treatment' } });
    
    const submitButton = screen.getByText('Подать жалобу');
    expect(submitButton).toBeDisabled();
  });

  it('disables submit button when only details are entered', () => {
    render(
      <ComplaintModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    const textarea = screen.getByPlaceholderText('Опишите подробно суть вашей жалобы...');
    fireEvent.change(textarea, { target: { value: 'Some details' } });
    
    const submitButton = screen.getByText('Подать жалобу');
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when both reason and details are provided', () => {
    render(
      <ComplaintModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    const select = screen.getByDisplayValue('Выберите причину...');
    fireEvent.change(select, { target: { value: 'rude_treatment' } });
    
    const textarea = screen.getByPlaceholderText('Опишите подробно суть вашей жалобы...');
    fireEvent.change(textarea, { target: { value: 'The operator was very rude' } });
    
    const submitButton = screen.getByText('Подать жалобу');
    expect(submitButton).not.toBeDisabled();
  });

  it('calls onSubmit with reason and details when submitted', () => {
    render(
      <ComplaintModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    const select = screen.getByDisplayValue('Выберите причину...');
    fireEvent.change(select, { target: { value: 'rude_treatment' } });
    
    const textarea = screen.getByPlaceholderText('Опишите подробно суть вашей жалобы...');
    fireEvent.change(textarea, { target: { value: 'The operator was very rude and unhelpful' } });
    
    const submitButton = screen.getByText('Подать жалобу');
    fireEvent.click(submitButton);
    
    expect(mockOnSubmit).toHaveBeenCalledWith('rude_treatment', 'The operator was very rude and unhelpful');
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <ComplaintModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    const closeButton = screen.getByRole('button', { name: /x/i });
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel button is clicked', () => {
    render(
      <ComplaintModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    const cancelButton = screen.getByText('Отмена');
    fireEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('resets form when closed', () => {
    render(
      <ComplaintModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    const select = screen.getByDisplayValue('Выберите причину...');
    fireEvent.change(select, { target: { value: 'rude_treatment' } });
    
    const textarea = screen.getByPlaceholderText('Опишите подробно суть вашей жалобы...');
    fireEvent.change(textarea, { target: { value: 'Some complaint' } });
    
    const closeButton = screen.getByRole('button', { name: /x/i });
    fireEvent.click(closeButton);
    
    // Form should be reset
    expect(select).toHaveValue('');
    expect(textarea).toHaveValue('');
  });

  it('resets form after successful submission', () => {
    render(
      <ComplaintModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    const select = screen.getByDisplayValue('Выберите причину...');
    fireEvent.change(select, { target: { value: 'rude_treatment' } });
    
    const textarea = screen.getByPlaceholderText('Опишите подробно суть вашей жалобы...');
    fireEvent.change(textarea, { target: { value: 'Some complaint' } });
    
    const submitButton = screen.getByText('Подать жалобу');
    fireEvent.click(submitButton);
    
    // Form should be reset
    expect(select).toHaveValue('');
    expect(textarea).toHaveValue('');
  });

  it('displays warning message', () => {
    render(
      <ComplaintModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    expect(screen.getByText('Внимание:')).toBeInTheDocument();
    expect(screen.getByText(/Ваша жалоба будет рассмотрена администрацией/)).toBeInTheDocument();
  });

  it('renders flag icon in header', () => {
    render(
      <ComplaintModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    const flagIcon = screen.getByText('Подать жалобу').closest('div')?.querySelector('svg');
    expect(flagIcon).toBeInTheDocument();
  });

  it('applies correct styling to submit button', () => {
    render(
      <ComplaintModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    const submitButton = screen.getByText('Подать жалобу');
    expect(submitButton).toHaveClass('bg-red-500', 'hover:bg-red-600');
  });

  it('applies correct modal backdrop styling', () => {
    render(
      <ComplaintModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    const backdrop = screen.getByText('Подать жалобу').closest('.fixed');
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

  it('applies correct warning box styling', () => {
    render(
      <ComplaintModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    const warningBox = screen.getByText('Внимание:').closest('div');
    expect(warningBox).toHaveClass(
      'bg-yellow-50',
      'border',
      'border-yellow-200',
      'rounded-md',
      'p-3'
    );
  });

  it('handles whitespace-only details correctly', () => {
    render(
      <ComplaintModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    const select = screen.getByDisplayValue('Выберите причину...');
    fireEvent.change(select, { target: { value: 'rude_treatment' } });
    
    const textarea = screen.getByPlaceholderText('Опишите подробно суть вашей жалобы...');
    fireEvent.change(textarea, { target: { value: '   ' } }); // Only whitespace
    
    const submitButton = screen.getByText('Подать жалобу');
    expect(submitButton).toBeDisabled();
  });
});