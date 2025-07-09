import { render, screen, waitFor } from '@/test-utils';
import WidgetDemoPage from '../page';

// Mock the ChatWidget component
jest.mock('@/components/ChatWidget/ChatWidget', () => {
  return function MockChatWidget() {
    return <div data-testid="chat-widget">Chat Widget Component</div>;
  };
});

describe('Widget Demo Page', () => {
  it('renders chat widget component', async () => {
    render(<WidgetDemoPage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('chat-widget')).toBeInTheDocument();
    });
  });

  it('displays demo page content', async () => {
    render(<WidgetDemoPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Chat Widget Component')).toBeInTheDocument();
    });
  });
});