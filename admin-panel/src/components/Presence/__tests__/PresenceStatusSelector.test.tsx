import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PresenceStatusSelector from '../PresenceStatusSelector';
import { PresenceStatus } from '../types';

describe('PresenceStatusSelector', () => {
  const mockOnStatusChange = jest.fn();

  beforeEach(() => {
    mockOnStatusChange.mockClear();
  });

  it('renders with current status', () => {
    render(
      <PresenceStatusSelector 
        currentStatus={PresenceStatus.ONLINE} 
        onStatusChange={mockOnStatusChange} 
      />
    );
    
    expect(screen.getByText('В сети')).toBeInTheDocument();
  });

  it('opens dropdown when clicked', () => {
    render(
      <PresenceStatusSelector 
        currentStatus={PresenceStatus.ONLINE} 
        onStatusChange={mockOnStatusChange} 
      />
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(screen.getByText('Отошел')).toBeInTheDocument();
    expect(screen.getByText('Занят')).toBeInTheDocument();
    expect(screen.getByText('Невидимый')).toBeInTheDocument();
  });

  it('calls onStatusChange when status is selected', () => {
    render(
      <PresenceStatusSelector 
        currentStatus={PresenceStatus.ONLINE} 
        onStatusChange={mockOnStatusChange} 
      />
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    const awayOption = screen.getByText('Отошел');
    fireEvent.click(awayOption);
    
    expect(mockOnStatusChange).toHaveBeenCalledWith(PresenceStatus.AWAY);
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <PresenceStatusSelector 
        currentStatus={PresenceStatus.ONLINE} 
        onStatusChange={mockOnStatusChange} 
        disabled={true}
      />
    );
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    
    fireEvent.click(button);
    expect(screen.queryByText('Отошел')).not.toBeInTheDocument();
  });

  it('closes dropdown when overlay is clicked', () => {
    render(
      <PresenceStatusSelector 
        currentStatus={PresenceStatus.ONLINE} 
        onStatusChange={mockOnStatusChange} 
      />
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(screen.getByText('Отошел')).toBeInTheDocument();
    
    // Click on the overlay (fixed inset-0 div)
    const overlay = document.querySelector('.fixed.inset-0');
    if (overlay) {
      fireEvent.click(overlay);
    }
    
    expect(screen.queryByText('Отошел')).not.toBeInTheDocument();
  });

  it('highlights current status in dropdown', () => {
    render(
      <PresenceStatusSelector 
        currentStatus={PresenceStatus.BUSY} 
        onStatusChange={mockOnStatusChange} 
      />
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    const busyOption = screen.getByText('Занят');
    expect(busyOption.closest('button')).toHaveClass('bg-blue-50', 'text-blue-900');
  });

  it('applies custom className', () => {
    render(
      <PresenceStatusSelector 
        currentStatus={PresenceStatus.ONLINE} 
        onStatusChange={mockOnStatusChange} 
        className="custom-class"
      />
    );
    
    const container = screen.getByRole('button').parentElement;
    expect(container).toHaveClass('custom-class');
  });
});