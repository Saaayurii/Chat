"use client";

import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import ChatWidget from './ChatWidget';

interface EmbeddableWidgetProps {
  config?: {
    apiUrl?: string;
    theme?: 'light' | 'dark';
    position?: 'bottom-right' | 'bottom-left';
    primaryColor?: string;
    allowFileUpload?: boolean;
    allowComplaint?: boolean;
    allowRating?: boolean;
    maxFileSize?: number;
    placeholder?: string;
    welcomeMessage?: string;
    operatorName?: string;
    operatorAvatar?: string;
    autoLoad?: boolean;
    minimizeOnStart?: boolean;
  };
}

export const EmbeddableWidget: React.FC<EmbeddableWidgetProps> = ({
  config = {}
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<any>(null);

  useEffect(() => {
    if (containerRef.current && !rootRef.current) {
      rootRef.current = createRoot(containerRef.current);
    }

    if (rootRef.current) {
      rootRef.current.render(
        <ChatWidget
          {...config}
          onClose={() => {
            // Опционально: уведомить родительский сайт о закрытии
            if (typeof window !== 'undefined' && window.parent) {
              window.parent.postMessage({
                type: 'CHAT_WIDGET_CLOSED'
              }, '*');
            }
          }}
          onMinimize={() => {
            // Опционально: уведомить родительский сайт о минимизации
            if (typeof window !== 'undefined' && window.parent) {
              window.parent.postMessage({
                type: 'CHAT_WIDGET_MINIMIZED'
              }, '*');
            }
          }}
        />
      );
    }

    return () => {
      if (rootRef.current) {
        rootRef.current.unmount();
        rootRef.current = null;
      }
    };
  }, [config]);

  return <div ref={containerRef} />;
};

// Глобальная функция для инициализации виджета
if (typeof window !== 'undefined') {
  (window as any).initChatWidget = (config: any) => {
    const existingWidget = document.getElementById('chat-widget-container');
    if (existingWidget) {
      existingWidget.remove();
    }

    const container = document.createElement('div');
    container.id = 'chat-widget-container';
    container.style.position = 'fixed';
    container.style.zIndex = '9999';
    container.style.pointerEvents = 'none';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    
    document.body.appendChild(container);

    const root = createRoot(container);
    root.render(<EmbeddableWidget config={config} />);

    // Вернуть API для управления виджетом
    return {
      destroy: () => {
        root.unmount();
        container.remove();
      },
      show: () => {
        container.style.display = 'block';
      },
      hide: () => {
        container.style.display = 'none';
      },
      updateConfig: (newConfig: any) => {
        root.render(<EmbeddableWidget config={{...config, ...newConfig}} />);
      }
    };
  };
}

export default EmbeddableWidget;