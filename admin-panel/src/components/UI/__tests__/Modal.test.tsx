import { render, screen, fireEvent } from '@/test-utils';
import Modal from '../Modal';

const mockOnClose = jest.fn();

describe('Modal Component', () => {
  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('renders when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );
    
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );
    
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  it('displays modal title', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Custom Title">
        <p>Content</p>
      </Modal>
    );
    
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test">
        <div>
          <p>First paragraph</p>
          <button>Action button</button>
        </div>
      </Modal>
    );
    
    expect(screen.getByText('First paragraph')).toBeInTheDocument();
    expect(screen.getByText('Action button')).toBeInTheDocument();
  });

  it('shows close button by default', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test">
        <p>Content</p>
      </Modal>
    );
    
    const closeButton = screen.getByRole('button');
    expect(closeButton).toBeInTheDocument();
  });

  it('hides close button when showCloseButton is false', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test" showCloseButton={false}>
        <p>Content</p>
      </Modal>
    );
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test">
        <p>Content</p>
      </Modal>
    );
    
    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test">
        <p>Content</p>
      </Modal>
    );
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when other keys are pressed', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test">
        <p>Content</p>
      </Modal>
    );
    
    fireEvent.keyDown(document, { key: 'Enter' });
    fireEvent.keyDown(document, { key: 'Space' });
    
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('applies default medium size classes', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test">
        <p>Content</p>
      </Modal>
    );
    
    const modalContent = screen.getByText('Content').closest('div')?.parentElement;
    expect(modalContent).toHaveClass('max-w-lg');
  });

  it('applies small size classes', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test" size="sm">
        <p>Content</p>
      </Modal>
    );
    
    const modalContent = screen.getByText('Content').closest('div')?.parentElement;
    expect(modalContent).toHaveClass('max-w-md');
  });

  it('applies large size classes', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test" size="lg">
        <p>Content</p>
      </Modal>
    );
    
    const modalContent = screen.getByText('Content').closest('div')?.parentElement;
    expect(modalContent).toHaveClass('max-w-2xl');
  });

  it('applies extra large size classes', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test" size="xl">
        <p>Content</p>
      </Modal>
    );
    
    const modalContent = screen.getByText('Content').closest('div')?.parentElement;
    expect(modalContent).toHaveClass('max-w-4xl');
  });

  it('applies backdrop classes', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test">
        <p>Content</p>
      </Modal>
    );
    
    const backdrop = screen.getByText('Content').closest('div')?.parentElement?.parentElement;
    expect(backdrop).toHaveClass(
      'fixed',
      'inset-0',
      'bg-black/50',
      'backdrop-blur-sm',
      'flex',
      'items-center',
      'justify-center',
      'z-50',
      'p-4'
    );
  });

  it('applies modal content classes', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test">
        <p>Content</p>
      </Modal>
    );
    
    const modalContent = screen.getByText('Content').closest('div')?.parentElement;
    expect(modalContent).toHaveClass(
      'bg-background',
      'border',
      'border-border',
      'rounded-lg',
      'w-full',
      'max-h-[90vh]',
      'overflow-y-auto',
      'shadow-lg'
    );
  });

  it('applies header classes', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test">
        <p>Content</p>
      </Modal>
    );
    
    const header = screen.getByText('Test').closest('div');
    expect(header).toHaveClass(
      'flex',
      'justify-between',
      'items-center',
      'p-6',
      'border-b',
      'border-border'
    );
  });

  it('applies title classes', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test">
        <p>Content</p>
      </Modal>
    );
    
    const title = screen.getByText('Test');
    expect(title).toHaveClass('text-xl', 'font-semibold', 'text-foreground');
  });

  it('applies content container classes', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test">
        <p>Content</p>
      </Modal>
    );
    
    const contentContainer = screen.getByText('Content').closest('div');
    expect(contentContainer).toHaveClass('p-6');
  });

  it('stops propagation on modal content click', () => {
    const mockStopPropagation = jest.fn();
    const originalAddEventListener = document.addEventListener;
    document.addEventListener = jest.fn((type, handler) => {
      if (type === 'click') {
        (handler as any)({ stopPropagation: mockStopPropagation } as any);
      }
    });

    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test">
        <p>Content</p>
      </Modal>
    );
    
    const modalContent = screen.getByText('Content').closest('div')?.parentElement;
    expect(modalContent).toBeInTheDocument();
    
    // Test that clicking modal content doesn't close modal
    fireEvent.click(modalContent!);
    expect(mockOnClose).not.toHaveBeenCalled();

    document.addEventListener = originalAddEventListener;
  });
});