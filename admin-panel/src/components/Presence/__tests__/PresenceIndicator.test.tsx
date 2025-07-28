import React from 'react';
import { render, screen } from '@testing-library/react';
import PresenceIndicator from '../PresenceIndicator';
import { PresenceStatus } from '../types';

describe('PresenceIndicator', () => {
  it('renders with online status', () => {
    render(<PresenceIndicator status={PresenceStatus.ONLINE} />);
    
    const indicator = screen.getByRole('generic');
    expect(indicator).toBeInTheDocument();
  });

  it('shows text when showText is true', () => {
    render(
      <PresenceIndicator 
        status={PresenceStatus.ONLINE} 
        showText={true} 
      />
    );
    
    expect(screen.getByText('В сети')).toBeInTheDocument();
  });

  it('applies correct size classes', () => {
    const { rerender } = render(
      <PresenceIndicator status={PresenceStatus.ONLINE} size="sm" />
    );
    
    // Small size should have w-2 h-2 class
    expect(screen.getByRole('generic').firstChild).toHaveClass('w-2', 'h-2');
    
    rerender(<PresenceIndicator status={PresenceStatus.ONLINE} size="lg" />);
    
    // Large size should have w-4 h-4 class
    expect(screen.getByRole('generic').firstChild).toHaveClass('w-4', 'h-4');
  });

  it('shows correct text for different statuses', () => {
    const { rerender } = render(
      <PresenceIndicator status={PresenceStatus.AWAY} showText={true} />
    );
    
    expect(screen.getByText('Отошел')).toBeInTheDocument();
    
    rerender(
      <PresenceIndicator status={PresenceStatus.BUSY} showText={true} />
    );
    
    expect(screen.getByText('Занят')).toBeInTheDocument();
    
    rerender(
      <PresenceIndicator status={PresenceStatus.OFFLINE} showText={true} />
    );
    
    expect(screen.getByText('Не в сети')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <PresenceIndicator 
        status={PresenceStatus.ONLINE} 
        className="custom-class" 
      />
    );
    
    expect(screen.getByRole('generic')).toHaveClass('custom-class');
  });

  it('has animation for online status', () => {
    render(<PresenceIndicator status={PresenceStatus.ONLINE} />);
    
    const container = screen.getByRole('generic').firstChild;
    expect(container?.firstChild).toHaveClass('animate-pulse');
  });

  it('does not have animation for offline status', () => {
    render(<PresenceIndicator status={PresenceStatus.OFFLINE} />);
    
    const container = screen.getByRole('generic').firstChild;
    expect(container?.firstChild).not.toHaveClass('animate-pulse');
  });
});