import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import OnlineUsersList from '../OnlineUsersList';
import { PresenceStatus, OnlineUser } from '../types';

const mockUsers: OnlineUser[] = [
  {
    userId: 'user1',
    lastSeen: Date.now() - 30000, // 30 seconds ago
    status: PresenceStatus.ONLINE,
    deviceType: 'desktop',
    activity: 'Активен в чате'
  },
  {
    userId: 'user2',
    lastSeen: Date.now() - 300000, // 5 minutes ago
    status: PresenceStatus.AWAY,
    deviceType: 'mobile'
  },
  {
    userId: 'user3',
    lastSeen: Date.now() - 3600000, // 1 hour ago
    status: PresenceStatus.BUSY,
    deviceType: 'tablet'
  }
];

describe('OnlineUsersList', () => {
  const mockOnUserClick = jest.fn();

  beforeEach(() => {
    mockOnUserClick.mockClear();
  });

  it('renders list of users', () => {
    render(<OnlineUsersList users={mockUsers} />);
    
    expect(screen.getByText('Онлайн (3)')).toBeInTheDocument();
    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.getByText('user2')).toBeInTheDocument();
    expect(screen.getByText('user3')).toBeInTheDocument();
  });

  it('shows empty state when no users', () => {
    render(<OnlineUsersList users={[]} />);
    
    expect(screen.getByText('Нет пользователей онлайн')).toBeInTheDocument();
  });

  it('limits visible users when maxVisible is set', () => {
    render(<OnlineUsersList users={mockUsers} maxVisible={2} />);
    
    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.getByText('user2')).toBeInTheDocument();
    expect(screen.queryByText('user3')).not.toBeInTheDocument();
    expect(screen.getByText('и еще 1 пользователей')).toBeInTheDocument();
  });

  it('calls onUserClick when user is clicked', () => {
    render(
      <OnlineUsersList 
        users={mockUsers} 
        onUserClick={mockOnUserClick} 
      />
    );
    
    const userElement = screen.getByText('user1').closest('div');
    if (userElement) {
      fireEvent.click(userElement);
    }
    
    expect(mockOnUserClick).toHaveBeenCalledWith('user1');
  });

  it('shows device type for users', () => {
    render(<OnlineUsersList users={mockUsers} />);
    
    expect(screen.getByText('desktop')).toBeInTheDocument();
    expect(screen.getByText('mobile')).toBeInTheDocument();
    expect(screen.getByText('tablet')).toBeInTheDocument();
  });

  it('shows activity for online users', () => {
    render(<OnlineUsersList users={mockUsers} />);
    
    expect(screen.getByText('Активен в чате')).toBeInTheDocument();
  });

  it('shows last seen time for non-online users', () => {
    render(<OnlineUsersList users={mockUsers} />);
    
    // Should show relative time for away/busy users
    expect(screen.getByText('5 мин назад')).toBeInTheDocument();
    expect(screen.getByText('1 ч назад')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <OnlineUsersList 
        users={mockUsers} 
        className="custom-class" 
      />
    );
    
    const container = screen.getByText('Онлайн (3)').closest('div');
    expect(container).toHaveClass('custom-class');
  });

  it('does not add hover styles when onUserClick is not provided', () => {
    render(<OnlineUsersList users={mockUsers} />);
    
    const userElement = screen.getByText('user1').closest('div');
    expect(userElement).not.toHaveClass('hover:bg-gray-100', 'cursor-pointer');
  });
});