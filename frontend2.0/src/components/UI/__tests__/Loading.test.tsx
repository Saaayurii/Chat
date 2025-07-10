import { render, screen } from '@/test-utils';
import Loading from '../Loading';

describe('Loading Component', () => {
  it('renders default loading spinner', () => {
    render(<Loading />);
    const spinner = document.querySelector('svg');
    expect(spinner).toBeInTheDocument();
  });

  it('renders default text', () => {
    render(<Loading />);
    expect(screen.getByText('Загрузка...')).toBeInTheDocument();
  });

  it('renders custom text', () => {
    render(<Loading text="Loading data..." />);
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('does not render text when text prop is empty', () => {
    render(<Loading text="" />);
    expect(screen.queryByText('Загрузка...')).not.toBeInTheDocument();
  });

  it('applies default medium size classes', () => {
    render(<Loading />);
    const spinner = document.querySelector('svg');
    expect(spinner).toHaveClass('w-8', 'h-8');
  });

  it('applies small size classes', () => {
    render(<Loading size="sm" />);
    const spinner = document.querySelector('svg');
    expect(spinner).toHaveClass('w-4', 'h-4');
  });

  it('applies large size classes', () => {
    render(<Loading size="lg" />);
    const spinner = document.querySelector('svg');
    expect(spinner).toHaveClass('w-12', 'h-12');
  });

  it('renders normal loading without fullScreen', () => {
    render(<Loading />);
    const container = screen.getByText('Загрузка...').closest('div')?.parentElement;
    expect(container).toHaveClass('flex', 'justify-center', 'p-8');
  });

  it('renders fullScreen loading', () => {
    render(<Loading fullScreen />);
    const container = screen.getByText('Загрузка...').closest('div')?.parentElement;
    expect(container).toHaveClass(
      'fixed',
      'inset-0',
      'bg-background/75',
      'backdrop-blur-sm',
      'flex',
      'items-center',
      'justify-center',
      'z-50'
    );
  });

  it('applies spinner animation classes', () => {
    render(<Loading />);
    const spinner = document.querySelector('svg');
    expect(spinner).toHaveClass('animate-spin', 'text-primary');
  });

  it('has correct SVG viewBox', () => {
    render(<Loading />);
    const spinner = document.querySelector('svg');
    expect(spinner).toHaveAttribute('viewBox', '0 0 24 24');
  });

  it('has correct SVG fill attribute', () => {
    render(<Loading />);
    const spinner = document.querySelector('svg');
    expect(spinner).toHaveAttribute('fill', 'none');
  });

  it('renders circle element with correct attributes', () => {
    render(<Loading />);
    const circle = document.querySelector('svg')?.querySelector('circle');
    expect(circle).toHaveAttribute('cx', '12');
    expect(circle).toHaveAttribute('cy', '12');
    expect(circle).toHaveAttribute('r', '10');
    expect(circle).toHaveAttribute('stroke', 'currentColor');
    expect(circle).toHaveAttribute('stroke-width', '4');
  });

  it('renders path element with correct attributes', () => {
    render(<Loading />);
    const path = document.querySelector('svg')?.querySelector('path');
    expect(path).toHaveAttribute('fill', 'currentColor');
    expect(path).toHaveClass('opacity-75');
  });

  it('has correct text styling', () => {
    render(<Loading />);
    const text = screen.getByText('Загрузка...');
    expect(text).toHaveClass('mt-2', 'text-muted-foreground', 'text-sm');
  });

  it('centers content correctly', () => {
    render(<Loading />);
    const innerContainer = screen.getByText('Загрузка...').closest('div');
    expect(innerContainer).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center');
  });
});