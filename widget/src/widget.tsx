// Entry point для встраиваемого виджета
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import ChatWidget from './components/ChatWidget';
import type { ChatWidgetConfig } from './types';
import './index.css';

// Глобальные переменные
let widgetRoot: Root | null = null;

// Функция инициализации виджета
function initChatWidget(config: ChatWidgetConfig): void {
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
  if (widgetRoot) {
    widgetRoot.unmount();
  }
  
  widgetRoot = createRoot(widgetContainer);
  widgetRoot.render(
    <div style={{ pointerEvents: 'auto' }}>
      <ChatWidget
        {...config}
        autoLoad={true}
      />
    </div>
  );
}

// Экспорт для IIFE сборки
(window as any).initChatWidget = initChatWidget;
(window as any).ChatWidget = ChatWidget;

// Автоматическая инициализация, если в window есть chatWidgetConfig
if (typeof window !== 'undefined' && (window as any).chatWidgetConfig) {
  initChatWidget((window as any).chatWidgetConfig);
}

export { initChatWidget, ChatWidget };
export default initChatWidget;