// Entry point для встраиваемого виджета
import { createRoot } from 'react-dom/client';
import ChatWidget from './components/ChatWidget';
import type { ChatWidgetConfig } from './types';
import './index.css';

// Глобальная функция инициализации виджета
declare global {
  interface Window {
    initChatWidget: (config: ChatWidgetConfig) => void;
    ChatWidget: typeof ChatWidget;
  }
}

// Функция инициализации виджета
window.initChatWidget = (config: ChatWidgetConfig) => {
  console.log('Initializing Chat Widget with config:', config);
  
  // Создаем контейнер для виджета
  let widgetContainer = document.getElementById('chat-widget-container');
  if (!widgetContainer) {
    widgetContainer = document.createElement('div');
    widgetContainer.id = 'chat-widget-container';
    widgetContainer.style.cssText = `
      position: fixed;
      z-index: 99999;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    `;
    document.body.appendChild(widgetContainer);
  }

  // Создаем React app в контейнере
  const root = createRoot(widgetContainer);
  root.render(
    <div style={{ pointerEvents: 'auto' }}>
      <ChatWidget
        {...config}
        autoLoad={true}
      />
    </div>
  );
};

// Экспортируем компонент для использования в других React приложениях
window.ChatWidget = ChatWidget;

// Автоматическая инициализация, если в window есть chatWidgetConfig
if (typeof window !== 'undefined' && (window as any).chatWidgetConfig) {
  window.initChatWidget((window as any).chatWidgetConfig);
}

export default ChatWidget;