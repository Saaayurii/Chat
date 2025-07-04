"use client";

import React, { useState } from 'react';
import ChatWidget from '../../components/ChatWidget/ChatWidget';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';
import { Input } from '../../components/UI/Input';
import Button from '@/components/UI/Button';
import { Badge } from '@/components/UI';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const WidgetDemo: React.FC = () => {
  const [config, setConfig] = useState({
    apiUrl: API_URL,
    theme: 'light' as 'light' | 'dark',
    position: 'bottom-right' as 'bottom-right' | 'bottom-left',
    primaryColor: '#3b82f6',
    allowFileUpload: true,
    allowComplaint: true,
    allowRating: true,
    maxFileSize: 10 * 1024 * 1024,
    placeholder: 'Введите сообщение...',
    welcomeMessage: 'Добро пожаловать! Как могу помочь?',
    operatorName: 'Оператор поддержки',
    operatorAvatar: ''
  });

  const [showWidget, setShowWidget] = useState(true);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const generateEmbedCode = () => {
    const code = `
<!-- Встраиваемый виджет чата -->
<script>
  (function() {
    var config = ${JSON.stringify(config, null, 2)};
    
    // Загрузка стилей
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '${config.apiUrl}/widget/chat-widget.css';
    document.head.appendChild(link);
    
    // Загрузка скрипта
    var script = document.createElement('script');
    script.src = '${config.apiUrl}/widget/chat-widget.js';
    script.onload = function() {
      if (window.initChatWidget) {
        window.initChatWidget(config);
      }
    };
    document.head.appendChild(script);
  })();
</script>`;
    
    return code;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Код скопирован в буфер обмена!');
    } catch (err) {
      console.error('Ошибка копирования:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Демонстрация Chat Widget
          </h1>
          <p className="text-gray-600">
            Настройте виджет чата и получите код для встраивания на ваш сайт
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Панель настроек */}
          <Card>
            <CardHeader>
              <CardTitle>Настройки виджета</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API URL
                </label>
                <Input
                  value={config.apiUrl}
                  onChange={(e) => handleConfigChange('apiUrl', e.target.value)}
                  placeholder="http://localhost:3000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Тема
                </label>
                <select
                  value={config.theme}
                  onChange={(e) => handleConfigChange('theme', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="light">Светлая</option>
                  <option value="dark">Темная</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Позиция
                </label>
                <select
                  value={config.position}
                  onChange={(e) => handleConfigChange('position', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="bottom-right">Правый нижний угол</option>
                  <option value="bottom-left">Левый нижний угол</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Основной цвет
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={config.primaryColor}
                    onChange={(e) => handleConfigChange('primaryColor', e.target.value)}
                    className="w-10 h-10 border border-gray-300 rounded"
                  />
                  <Input
                    value={config.primaryColor}
                    onChange={(e) => handleConfigChange('primaryColor', e.target.value)}
                    placeholder="#3b82f6"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Имя оператора
                </label>
                <Input
                  value={config.operatorName}
                  onChange={(e) => handleConfigChange('operatorName', e.target.value)}
                  placeholder="Оператор поддержки"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Приветственное сообщение
                </label>
                <Input
                  value={config.welcomeMessage}
                  onChange={(e) => handleConfigChange('welcomeMessage', e.target.value)}
                  placeholder="Добро пожаловать! Как могу помочь?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Placeholder для ввода
                </label>
                <Input
                  value={config.placeholder}
                  onChange={(e) => handleConfigChange('placeholder', e.target.value)}
                  placeholder="Введите сообщение..."
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.allowFileUpload}
                    onChange={(e) => handleConfigChange('allowFileUpload', e.target.checked)}
                    className="mr-2"
                  />
                  <label className="text-sm text-gray-700">Разрешить загрузку файлов</label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.allowComplaint}
                    onChange={(e) => handleConfigChange('allowComplaint', e.target.checked)}
                    className="mr-2"
                  />
                  <label className="text-sm text-gray-700">Разрешить жалобы</label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.allowRating}
                    onChange={(e) => handleConfigChange('allowRating', e.target.checked)}
                    className="mr-2"
                  />
                  <label className="text-sm text-gray-700">Разрешить оценки</label>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button
                  onClick={() => setShowWidget(!showWidget)}
                  className="w-full"
                  variant={showWidget ? "outline" : "default"}
                >
                  {showWidget ? 'Скрыть виджет' : 'Показать виджет'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Код для встраивания */}
          <Card>
            <CardHeader>
              <CardTitle>Код для встраивания</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                <pre>{generateEmbedCode()}</pre>
              </div>
              <div className="mt-4 flex space-x-2">
                <Button
                  onClick={() => copyToClipboard(generateEmbedCode())}
                  className="flex-1"
                >
                  Скопировать код
                </Button>
                <Button
                  onClick={() => {
                    const blob = new Blob([generateEmbedCode()], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'chat-widget-embed.html';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  variant="outline"
                >
                  Скачать как HTML
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Инструкция по использованию */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Инструкция по использованию</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <Badge variant="outline" className="mb-2">Шаг 1</Badge>
                <p>Настройте виджет в панели слева, выбрав подходящие параметры</p>
              </div>
              <div>
                <Badge variant="outline" className="mb-2">Шаг 2</Badge>
                <p>Скопируйте сгенерированный код для встраивания</p>
              </div>
              <div>
                <Badge variant="outline" className="mb-2">Шаг 3</Badge>
                <p>Вставьте код в HTML страницу вашего сайта перед закрывающим тегом &lt;/body&gt;</p>
              </div>
              <div>
                <Badge variant="outline" className="mb-2">Шаг 4</Badge>
                <p>Убедитесь, что ваш backend API запущен и доступен по указанному URL</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Демонстрация виджета */}
      {showWidget && (
        <div style={{ position: 'fixed', zIndex: 1000, pointerEvents: 'none', top: 0, left: 0, width: '100%', height: '100%' }}>
          <div style={{ pointerEvents: 'auto' }}>
            <ChatWidget
              {...config}
              onClose={() => setShowWidget(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default WidgetDemo;