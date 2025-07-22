import React, { useState } from 'react';
import ChatWidget from './components/ChatWidget';
import type { ChatWidgetConfig } from './types';

const App: React.FC = () => {
  const [showWidget, setShowWidget] = useState(true);
  
  // Конфигурация виджета по умолчанию из переменных окружения
  const [config, setConfig] = useState<ChatWidgetConfig>({
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3004',
    theme: (import.meta.env.VITE_WIDGET_THEME as 'light' | 'dark') || 'light',
    position: (import.meta.env.VITE_WIDGET_POSITION as 'bottom-right' | 'bottom-left') || 'bottom-right',
    primaryColor: import.meta.env.VITE_WIDGET_PRIMARY_COLOR || '#3b82f6',
    allowFileUpload: import.meta.env.VITE_WIDGET_ALLOW_FILE_UPLOAD === 'true',
    allowComplaint: import.meta.env.VITE_WIDGET_ALLOW_COMPLAINT === 'true',
    allowRating: import.meta.env.VITE_WIDGET_ALLOW_RATING === 'true',
    maxFileSize: parseInt(import.meta.env.VITE_WIDGET_MAX_FILE_SIZE || '10485760'),
    placeholder: import.meta.env.VITE_WIDGET_PLACEHOLDER || 'Введите сообщение...',
    welcomeMessage: import.meta.env.VITE_WIDGET_WELCOME_MESSAGE || 'Добро пожаловать! Как могу помочь?',
    operatorName: import.meta.env.VITE_WIDGET_OPERATOR_NAME || 'Оператор поддержки',
    operatorAvatar: '',
    autoLoad: true,
    minimizeOnStart: false
  });

  const handleConfigChange = (key: keyof ChatWidgetConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Demo page content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Chat Widget Demo
            </h1>
            <p className="text-xl text-gray-600">
              Независимый виджет чата для встраивания на любые сайты
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Configuration Panel */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Конфигурация виджета
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API URL
                  </label>
                  <input
                    type="text"
                    value={config.apiUrl || ''}
                    onChange={(e) => handleConfigChange('apiUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="http://localhost:3004"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Тема
                  </label>
                  <select
                    value={config.theme || 'light'}
                    onChange={(e) => handleConfigChange('theme', e.target.value as 'light' | 'dark')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="light">Светлая</option>
                    <option value="dark">Темная</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Позиция
                  </label>
                  <select
                    value={config.position || 'bottom-right'}
                    onChange={(e) => handleConfigChange('position', e.target.value as 'bottom-right' | 'bottom-left')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="bottom-right">Правый нижний угол</option>
                    <option value="bottom-left">Левый нижний угол</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Основной цвет
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={config.primaryColor || '#3b82f6'}
                      onChange={(e) => handleConfigChange('primaryColor', e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={config.primaryColor || '#3b82f6'}
                      onChange={(e) => handleConfigChange('primaryColor', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Имя оператора
                  </label>
                  <input
                    type="text"
                    value={config.operatorName || ''}
                    onChange={(e) => handleConfigChange('operatorName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Оператор поддержки"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Приветственное сообщение
                  </label>
                  <input
                    type="text"
                    value={config.welcomeMessage || ''}
                    onChange={(e) => handleConfigChange('welcomeMessage', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Добро пожаловать! Как могу помочь?"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.allowFileUpload || false}
                      onChange={(e) => handleConfigChange('allowFileUpload', e.target.checked)}
                      className="mr-2"
                    />
                    <label className="text-sm text-gray-700">Разрешить загрузку файлов</label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.allowComplaint || false}
                      onChange={(e) => handleConfigChange('allowComplaint', e.target.checked)}
                      className="mr-2"
                    />
                    <label className="text-sm text-gray-700">Разрешить жалобы</label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.allowRating || false}
                      onChange={(e) => handleConfigChange('allowRating', e.target.checked)}
                      className="mr-2"
                    />
                    <label className="text-sm text-gray-700">Разрешить оценки</label>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <button
                    onClick={() => setShowWidget(!showWidget)}
                    className={`w-full px-4 py-2 rounded-md font-medium transition-colors ${
                      showWidget
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {showWidget ? 'Скрыть виджет' : 'Показать виджет'}
                  </button>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Инструкции
              </h2>
              
              <div className="space-y-4 text-sm text-gray-700">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    🔧 Настройка
                  </h3>
                  <p>
                    Используйте панель конфигурации слева для настройки внешнего вида и поведения виджета.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    🎯 Функциональность
                  </h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>JWT авторизация и анонимные сессии</li>
                    <li>WebSocket подключение для real-time чата</li>
                    <li>Автоматическое назначение операторов</li>
                    <li>История сообщений</li>
                    <li>Загрузка файлов</li>
                    <li>Система рейтингов и жалоб</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    📦 Встраивание
                  </h3>
                  <p>
                    Виджет готов к встраиванию на любые сайты через простой script тег. 
                    Соберите проект командой <code className="bg-gray-100 px-1 rounded">npm run build</code>.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    🔌 API
                  </h3>
                  <p>
                    Убедитесь, что backend API запущен на указанном URL и доступен для подключения.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Current Configuration Display */}
          <div className="mt-8 bg-gray-800 text-white rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Текущая конфигурация:</h3>
            <pre className="text-sm overflow-x-auto">
              {JSON.stringify(config, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      {/* Chat Widget */}
      {showWidget && (
        <ChatWidget
          {...config}
          onClose={() => setShowWidget(false)}
        />
      )}
    </div>
  );
};

export default App;