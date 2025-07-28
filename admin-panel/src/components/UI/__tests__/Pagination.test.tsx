import { render, screen, fireEvent } from '@/test-utils';
import Pagination from '../Pagination';

const mockOnPageChange = jest.fn();

describe('Pagination Component', () => {
  beforeEach(() => {
    mockOnPageChange.mockClear();
  });

  it('does not render when totalPages is 1', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={1}
        onPageChange={mockOnPageChange}
      />
    );
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('does not render when totalPages is 0', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={0}
        onPageChange={mockOnPageChange}
      />
    );
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders previous and next buttons', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );
    
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toBeInTheDocument(); // Previous button
    expect(buttons[buttons.length - 1]).toBeInTheDocument(); // Next button
  });

  it('disables previous button on first page', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );
    
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );
    
    const buttons = screen.getAllByRole('button');
    expect(buttons[buttons.length - 1]).toBeDisabled();
  });

  it('calls onPageChange when previous button is clicked', () => {
    render(
      <Pagination
        currentPage={3}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );
    
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange when next button is clicked', () => {
    render(
      <Pagination
        currentPage={3}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );
    
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[buttons.length - 1]);
    
    expect(mockOnPageChange).toHaveBeenCalledWith(4);
  });

  it('renders page numbers by default', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );
    
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('highlights current page', () => {
    render(
      <Pagination
        currentPage={3}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );
    
    const currentPageButton = screen.getByText('3');
    expect(currentPageButton).toBeInTheDocument();
    // Current page should have primary variant, others secondary
  });

  it('calls onPageChange when page number is clicked', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );
    
    const pageButton = screen.getByText('4');
    fireEvent.click(pageButton);
    
    expect(mockOnPageChange).toHaveBeenCalledWith(4);
  });

  it('shows page info when showPageNumbers is false', () => {
    render(
      <Pagination
        currentPage={3}
        totalPages={10}
        onPageChange={mockOnPageChange}
        showPageNumbers={false}
      />
    );
    
    expect(screen.getByText('Страница 3 из 10')).toBeInTheDocument();
    expect(screen.queryByText('1')).not.toBeInTheDocument();
    expect(screen.queryByText('2')).not.toBeInTheDocument();
  });

  it('shows ellipsis when there are many pages', () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={10}
        onPageChange={mockOnPageChange}
        maxVisiblePages={3}
      />
    );
    
    const ellipsis = screen.getAllByText('...');
    expect(ellipsis.length).toBeGreaterThan(0);
  });

  it('shows first page when not in visible range', () => {
    render(
      <Pagination
        currentPage={8}
        totalPages={10}
        onPageChange={mockOnPageChange}
        maxVisiblePages={3}
      />
    );
    
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('calls onPageChange when first page button is clicked', () => {
    render(
      <Pagination
        currentPage={8}
        totalPages={10}
        onPageChange={mockOnPageChange}
        maxVisiblePages={3}
      />
    );
    
    const firstPageButton = screen.getByText('1');
    fireEvent.click(firstPageButton);
    
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
  });

  it('calls onPageChange when last page button is clicked', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={10}
        onPageChange={mockOnPageChange}
        maxVisiblePages={3}
      />
    );
    
    const lastPageButton = screen.getByText('10');
    fireEvent.click(lastPageButton);
    
    expect(mockOnPageChange).toHaveBeenCalledWith(10);
  });

  it('handles edge case with small number of pages', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={3}
        onPageChange={mockOnPageChange}
        maxVisiblePages={5}
      />
    );
    
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.queryByText('...')).not.toBeInTheDocument();
  });

  it('shows correct visible pages in the middle', () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={10}
        onPageChange={mockOnPageChange}
        maxVisiblePages={3}
      />
    );
    
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  it('adjusts visible pages when near the end', () => {
    render(
      <Pagination
        currentPage={9}
        totalPages={10}
        onPageChange={mockOnPageChange}
        maxVisiblePages={3}
      />
    );
    
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('applies correct container classes', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );
    
    const container = screen.getByText('1').closest('div');
    expect(container).toHaveClass('flex', 'items-center', 'justify-center', 'gap-2');
  });
});