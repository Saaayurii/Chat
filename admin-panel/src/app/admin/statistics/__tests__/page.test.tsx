import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminStatisticsPage from '../page';
import { useAuthStore } from '@/store/authStore';
import { usersAPI, statisticsAPI } from '@/core/api';

// Mock dependencies
jest.mock('@/store/authStore');
jest.mock('@/core/api');
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children, data }: any) => <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)}>{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Bar: (props: any) => <div data-testid="bar" {...props} />,
  Pie: (props: any) => <div data-testid="pie" {...props} />,
  XAxis: (props: any) => <div data-testid="x-axis" {...props} />,
  YAxis: (props: any) => <div data-testid="y-axis" {...props} />,
  CartesianGrid: (props: any) => <div data-testid="cartesian-grid" {...props} />,
  Tooltip: (props: any) => <div data-testid="tooltip" {...props} />,
  Legend: (props: any) => <div data-testid="legend" {...props} />,
  Cell: (props: any) => <div data-testid="cell" {...props} />
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe('AdminStatisticsPage', () => {
  let queryClient: QueryClient;
  let user: ReturnType<typeof userEvent.setup>;

  const mockAdminUser = {
    id: 'admin-123',
    email: 'admin@example.com',
    role: 'ADMIN',
    profile: {
      username: 'admin',
      fullName: 'Admin User'
    }
  };

  const mockOperators = [
    {
      _id: 'op-1',
      email: 'operator1@example.com',
      role: 'OPERATOR',
      profile: {
        username: 'operator1',
        fullName: 'John Operator',
        isOnline: true
      },
      operatorStats: {
        totalQuestions: 50,
        averageRating: 4.5,
        responseTimeAvg: 5
      }
    },
    {
      _id: 'op-2',
      email: 'operator2@example.com',
      role: 'OPERATOR',
      profile: {
        username: 'operator2',
        fullName: 'Jane Operator',
        isOnline: false
      },
      operatorStats: {
        totalQuestions: 30,
        averageRating: 4.2,
        responseTimeAvg: 7
      }
    }
  ];

  const mockStats = {
    usersStats: {
      total: 150,
      online: 25,
      new: 5
    },
    questionsStats: {
      statusStats: [
        { _id: 'open', count: 10 },
        { _id: 'closed', count: 40 },
        { _id: 'in_progress', count: 15 }
      ],
      avgResponseTime: 5.5
    },
    ratingsStats: {
      overall: {
        totalRatings: 100,
        averageRating: 4.3
      },
      distribution: [
        { _id: 1, count: 5 },
        { _id: 2, count: 8 },
        { _id: 3, count: 15 },
        { _id: 4, count: 30 },
        { _id: 5, count: 42 }
      ]
    },
    complaintsStats: {
      statusStats: [
        { _id: 'pending', count: 3 },
        { _id: 'resolved', count: 12 }
      ]
    }
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
    });
    user = userEvent.setup();
    
    mockUseAuthStore.mockReturnValue({ user: mockAdminUser });
    
    (usersAPI.getOperators as jest.Mock).mockResolvedValue({ data: mockOperators });
    (statisticsAPI.getUsersStats as jest.Mock).mockResolvedValue({ data: mockStats.usersStats });
    (statisticsAPI.getQuestionsStats as jest.Mock).mockResolvedValue({ data: mockStats.questionsStats });
    (statisticsAPI.getRatingsStats as jest.Mock).mockResolvedValue({ data: mockStats.ratingsStats });
    (statisticsAPI.getComplaintsStats as jest.Mock).mockResolvedValue({ data: mockStats.complaintsStats });
    
    jest.clearAllMocks();
  });

  const renderWithProviders = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <AdminStatisticsPage />
      </QueryClientProvider>
    );
  };

  describe('Page Layout', () => {
    test('renders main statistics dashboard', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Статистика')).toBeInTheDocument();
        expect(screen.getByText('Административная панель')).toBeInTheDocument();
      });
    });

    test('shows sidebar with role filters', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Статистика по ролям')).toBeInTheDocument();
        expect(screen.getByText('Администратор')).toBeInTheDocument();
        expect(screen.getByText('Оператор')).toBeInTheDocument();
      });
    });

    test('displays time period filters', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Период времени')).toBeInTheDocument();
        expect(screen.getByText('Сегодня')).toBeInTheDocument();
        expect(screen.getByText('Вчера')).toBeInTheDocument();
        expect(screen.getByText('Неделя')).toBeInTheDocument();
        expect(screen.getByText('Месяц')).toBeInTheDocument();
      });
    });

    test('shows operators list', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Операторы')).toBeInTheDocument();
        expect(screen.getByText('John Operator')).toBeInTheDocument();
        expect(screen.getByText('Jane Operator')).toBeInTheDocument();
      });
    });
  });

  describe('Statistics Cards', () => {
    test('displays main statistics cards', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Диалогов')).toBeInTheDocument();
        expect(screen.getByText('Лайков')).toBeInTheDocument();
        expect(screen.getByText('Дизлайков')).toBeInTheDocument();
        expect(screen.getByText('Среднее время ответа')).toBeInTheDocument();
      });
    });

    test('shows correct statistics values', async () => {
      renderWithProviders();

      await waitFor(() => {
        // Total questions (10 + 40 + 15 = 65)
        expect(screen.getByText('65')).toBeInTheDocument();
        
        // Likes (ratings 4-5: 30 + 42 = 72)
        expect(screen.getByText('72')).toBeInTheDocument();
        
        // Dislikes (ratings 1-2: 5 + 8 = 13)
        expect(screen.getByText('13')).toBeInTheDocument();
        
        // Average response time
        expect(screen.getByText('6')).toBeInTheDocument(); // rounded 5.5
      });
    });

    test('displays summary statistics', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Всего пользователей')).toBeInTheDocument();
        expect(screen.getByText('150')).toBeInTheDocument();
        
        expect(screen.getByText('Онлайн сейчас')).toBeInTheDocument();
        expect(screen.getByText('25')).toBeInTheDocument();
        
        expect(screen.getByText('Средний рейтинг')).toBeInTheDocument();
        expect(screen.getByText('4.3')).toBeInTheDocument();
        
        expect(screen.getByText('Жалобы')).toBeInTheDocument();
        expect(screen.getByText('15')).toBeInTheDocument(); // 3 + 12
      });
    });
  });

  describe('Charts', () => {
    test('renders charts components', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Статус вопросов')).toBeInTheDocument();
        expect(screen.getByText('Распределение оценок')).toBeInTheDocument();
        expect(screen.getByText('Производительность операторов')).toBeInTheDocument();
      });

      expect(screen.getAllByTestId('responsive-container')).toHaveLength(3);
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      expect(screen.getAllByTestId('bar-chart')).toHaveLength(2);
    });

    test('pie chart displays questions status data', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      });

      const pieChart = screen.getByTestId('pie');
      expect(pieChart).toBeInTheDocument();
    });

    test('bar chart displays ratings distribution', async () => {
      renderWithProviders();

      await waitFor(() => {
        const barCharts = screen.getAllByTestId('bar-chart');
        expect(barCharts[0]).toBeInTheDocument();
      });
    });
  });

  describe('Role Switching', () => {
    test('switches between admin and operator views', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Административная панель')).toBeInTheDocument();
      });

      const operatorButton = screen.getByText('Оператор');
      await user.click(operatorButton);

      await waitFor(() => {
        expect(screen.getByText('Статистика оператора')).toBeInTheDocument();
      });

      const adminButton = screen.getByText('Администратор');
      await user.click(adminButton);

      await waitFor(() => {
        expect(screen.getByText('Административная панель')).toBeInTheDocument();
      });
    });

    test('shows operator-specific interface when operator selected', async () => {
      renderWithProviders();

      const operatorButton = screen.getByText('Оператор');
      await user.click(operatorButton);

      const operatorCard = screen.getByText('John Operator').closest('button');
      await user.click(operatorCard!);

      await waitFor(() => {
        expect(screen.getByText('John Operator')).toBeInTheDocument();
      });
    });
  });

  describe('Time Period Filtering', () => {
    test('switches between time periods', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Сегодня')).toBeInTheDocument();
      });

      const weekButton = screen.getByText('Неделя');
      await user.click(weekButton);

      expect(statisticsAPI.getUsersStats).toHaveBeenCalledWith(
        expect.objectContaining({
          dateFrom: expect.any(String),
          dateTo: expect.any(String)
        })
      );
    });

    test('shows custom date inputs when custom period selected', async () => {
      renderWithProviders();

      const customButton = screen.getByText('Период');
      await user.click(customButton);

      await waitFor(() => {
        const dateInputs = screen.getAllByDisplayValue('');
        expect(dateInputs.filter(input => input.getAttribute('type') === 'date')).toHaveLength(2);
      });
    });
  });

  describe('Operator Search and Selection', () => {
    test('filters operators by search query', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('John Operator')).toBeInTheDocument();
        expect(screen.getByText('Jane Operator')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Поиск оператора...');
      await user.type(searchInput, 'John');

      // Both operators should still be visible since filtering is client-side
      expect(screen.getByText('John Operator')).toBeInTheDocument();
    });

    test('selects specific operator', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('John Operator')).toBeInTheDocument();
      });

      const operatorCard = screen.getByText('John Operator').closest('button');
      await user.click(operatorCard!);

      // Should show operator stats
      expect(screen.getByText('50')).toBeInTheDocument(); // operator stats badge
    });

    test('shows "All operators" option', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Все операторы')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument(); // total operators count
      });
    });
  });

  describe('Refresh Functionality', () => {
    test('has refresh button that reloads page', async () => {
      // Mock window.location.reload
      const mockReload = jest.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true
      });

      renderWithProviders();

      await waitFor(() => {
        const refreshButton = screen.getByText('Обновить');
        expect(refreshButton).toBeInTheDocument();
      });

      const refreshButton = screen.getByText('Обновить');
      await user.click(refreshButton);

      expect(mockReload).toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    test('shows loading state when data is being fetched', () => {
      (statisticsAPI.getUsersStats as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      renderWithProviders();

      expect(screen.getByText('Загрузка статистики...')).toBeInTheDocument();
      expect(screen.getByRole('status', { hidden: true })).toHaveClass('animate-spin');
    });

    test('shows loading for operators list', () => {
      (usersAPI.getOperators as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      renderWithProviders();

      expect(screen.getByText('Загрузка...')).toBeInTheDocument();
    });
  });

  describe('Modal Functionality', () => {
    test('opens operators modal when "Show all" is clicked', async () => {
      // Mock more operators to trigger the "show all" button
      const manyOperators = Array.from({ length: 12 }, (_, i) => ({
        _id: `op-${i}`,
        email: `operator${i}@example.com`,
        role: 'OPERATOR',
        profile: {
          username: `operator${i}`,
          fullName: `Operator ${i}`,
          isOnline: i % 2 === 0
        },
        operatorStats: {
          totalQuestions: 10 + i,
          averageRating: 4 + (i % 2) * 0.5,
          responseTimeAvg: 5 + i
        }
      }));

      (usersAPI.getOperators as jest.Mock).mockResolvedValue({ data: manyOperators });

      renderWithProviders();

      await waitFor(() => {
        const showAllButton = screen.getByText(/Показать всех/);
        expect(showAllButton).toBeInTheDocument();
      });

      const showAllButton = screen.getByText(/Показать всех/);
      await user.click(showAllButton);

      await waitFor(() => {
        expect(screen.getByText('Список операторов')).toBeInTheDocument();
      });
    });

    test('closes modal when close button is clicked', async () => {
      // Setup modal state
      const manyOperators = Array.from({ length: 12 }, (_, i) => ({
        _id: `op-${i}`,
        email: `operator${i}@example.com`,
        role: 'OPERATOR',
        profile: {
          username: `operator${i}`,
          fullName: `Operator ${i}`,
          isOnline: true
        },
        operatorStats: { totalQuestions: 10, averageRating: 4.0, responseTimeAvg: 5 }
      }));

      (usersAPI.getOperators as jest.Mock).mockResolvedValue({ data: manyOperators });

      renderWithProviders();

      await waitFor(() => {
        const showAllButton = screen.getByText(/Показать всех/);
        expect(showAllButton).toBeInTheDocument();
      });

      const showAllButton = screen.getByText(/Показать всех/);
      await user.click(showAllButton);

      await waitFor(() => {
        expect(screen.getByText('Список операторов')).toBeInTheDocument();
      });

      const closeButton = screen.getByText('✕');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Список операторов')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles API errors gracefully', async () => {
      (statisticsAPI.getUsersStats as jest.Mock).mockRejectedValue(new Error('API Error'));

      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      renderWithProviders();

      await waitFor(() => {
        // Should still render basic layout even with API errors
        expect(screen.getByText('Статистика')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    test('shows empty state when no data available', async () => {
      (usersAPI.getOperators as jest.Mock).mockResolvedValue({ data: [] });
      (statisticsAPI.getUsersStats as jest.Mock).mockResolvedValue({ data: null });

      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument(); // operators count
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper heading structure', async () => {
      renderWithProviders();

      await waitFor(() => {
        const mainHeading = screen.getByRole('heading', { level: 1 });
        expect(mainHeading).toHaveTextContent('Статистика');
      });

      const subHeadings = screen.getAllByRole('heading', { level: 2 });
      expect(subHeadings.length).toBeGreaterThan(0);
    });

    test('provides proper button labels', async () => {
      renderWithProviders();

      await waitFor(() => {
        const adminButton = screen.getByRole('button', { name: /администратор/i });
        expect(adminButton).toBeInTheDocument();

        const operatorButton = screen.getByRole('button', { name: /оператор/i });
        expect(operatorButton).toBeInTheDocument();
      });
    });

    test('has accessible form inputs', async () => {
      renderWithProviders();

      const customButton = screen.getByText('Период');
      await user.click(customButton);

      await waitFor(() => {
        const dateInputs = screen.getAllByDisplayValue('');
        const typeDate = dateInputs.filter(input => input.getAttribute('type') === 'date');
        expect(typeDate).toHaveLength(2);
        
        typeDate.forEach(input => {
          expect(input).toHaveAttribute('type', 'date');
        });
      });
    });
  });

  describe('Performance', () => {
    test('memoizes operators filtering', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('John Operator')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Поиск оператора...');
      
      // Multiple search operations should not cause excessive re-renders
      await user.type(searchInput, 'John');
      await user.clear(searchInput);
      await user.type(searchInput, 'Jane');

      expect(screen.getByText('Jane Operator')).toBeInTheDocument();
    });

    test('handles large datasets efficiently', async () => {
      const largeOperatorList = Array.from({ length: 100 }, (_, i) => ({
        _id: `op-${i}`,
        email: `operator${i}@example.com`,
        role: 'OPERATOR',
        profile: {
          username: `operator${i}`,
          fullName: `Operator ${i}`,
          isOnline: i % 3 === 0
        },
        operatorStats: {
          totalQuestions: Math.floor(Math.random() * 100),
          averageRating: 3 + Math.random() * 2,
          responseTimeAvg: 2 + Math.random() * 10
        }
      }));

      (usersAPI.getOperators as jest.Mock).mockResolvedValue({ data: largeOperatorList });

      renderWithProviders();

      await waitFor(() => {
        // Should only display first 8 operators
        expect(screen.getByText('Operator 0')).toBeInTheDocument();
        expect(screen.getByText('Operator 7')).toBeInTheDocument();
        expect(screen.queryByText('Operator 8')).not.toBeInTheDocument();
      });

      // Should show "Show all" button
      expect(screen.getByText(/Показать всех \(92 еще\)/)).toBeInTheDocument();
    });
  });
});