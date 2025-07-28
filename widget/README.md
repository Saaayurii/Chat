# Chat Widget 💬

Независимый виджет чата для встраивания на любые веб-сайты. Построен на React + TypeScript + Tailwind CSS + Zustand.

## ✨ Основные возможности

- 🔐 **JWT авторизация и анонимные сессии**
- 🚀 **Real-time чат через WebSocket**
- 👤 **Автоматическое назначение операторов**
- 💾 **История сообщений**
- 📎 **Загрузка файлов**
- ⭐ **Система рейтингов и жалоб**
- 🎨 **Настраиваемый дизайн**
- 📱 **Адаптивный интерфейс**

## 🚀 Быстрый старт

### Разработка

1. **Клонирование и установка:**
```bash
cd widget
npm install
```

2. **Настройка окружения:**
```bash
cp .env.example .env
# Отредактируйте .env файл под ваши настройки
```

3. **Запуск в режиме разработки:**
```bash
npm run dev
```

4. **Открыть в браузере:**
```
http://localhost:3005
```

### Сборка для продакшена

```bash
npm run build
```

Готовые файлы будут в папке `dist/`:
- `chat-widget.js` - основной скрипт виджета
- `chat-widget.css` - стили виджета

## 🔧 Встраивание на сайт

> ✅ **Виджет готов к использованию!** После выполнения `npm run build` все файлы находятся в папке `dist/`

### Готовые файлы после сборки:

```
dist/
├── chat-widget.css              # Стили виджета (20.16 KB)
├── chat-widget.iife.js          # Встраиваемый виджет (666.85 KB) ✅
├── example.html                 # Пример встраивания  
└── vite.svg                     # Иконка Vite
```

### Простой способ встраивания

```html
<!-- CSS виджета -->
<link rel="stylesheet" href="./dist/chat-widget.css">

<!-- JS файл виджета (один файл!) -->
<script src="./dist/chat-widget.iife.js"></script>

<!-- Инициализация -->
<script>
window.addEventListener('load', function() {
    if (window.ChatWidget && window.ChatWidget.initChatWidget) {
        window.ChatWidget.initChatWidget({
            apiUrl: 'http://localhost:3004',
            theme: 'light',
            position: 'bottom-right',
            primaryColor: '#3b82f6',
            allowFileUpload: true,
            allowComplaint: true,
            allowRating: true,
            welcomeMessage: 'Добро пожаловать! Как могу помочь?',
            operatorName: 'Оператор поддержки'
        });
    }
});
</script>
```

### Продакшн способ (для CDN)

```html
<script>
(function() {
    // Конфигурация виджета
    window.chatWidgetConfig = {
        apiUrl: 'https://your-api-domain.com',
        theme: 'light',
        position: 'bottom-right',
        primaryColor: '#3b82f6',
        allowFileUpload: true,
        allowComplaint: true,
        allowRating: true,
        welcomeMessage: 'Добро пожаловать! Как могу помочь?',
        operatorName: 'Служба поддержки'
    };
    
    // Загрузка стилей
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://your-cdn.com/chat-widget.css';
    document.head.appendChild(link);
    
    // Загрузка виджета (один файл!)
    var script = document.createElement('script');
    script.src = 'https://your-cdn.com/chat-widget.iife.js';
    script.onload = function() {
        // Инициализация после загрузки
        if (window.ChatWidget && window.ChatWidget.initChatWidget) {
            window.ChatWidget.initChatWidget(window.chatWidgetConfig);
        }
    };
    script.async = true;
    document.body.appendChild(script);
})();
</script>
```

### 🎯 Демо

Откройте файл `example.html` в браузере для полного примера встраивания!

## ⚙️ Конфигурация

### Основные параметры

| Параметр | Тип | Описание | По умолчанию |
|----------|-----|----------|--------------|
| `apiUrl` | string | URL API сервера | http://localhost:3004 |
| `theme` | 'light' \| 'dark' | Тема виджета | 'light' |
| `position` | 'bottom-right' \| 'bottom-left' | Позиция виджета | 'bottom-right' |
| `primaryColor` | string | Основной цвет | '#3b82f6' |
| `allowFileUpload` | boolean | Разрешить загрузку файлов | true |
| `allowComplaint` | boolean | Разрешить жалобы | true |
| `allowRating` | boolean | Разрешить рейтинги | true |
| `maxFileSize` | number | Макс. размер файла (байт) | 10485760 (10MB) |
| `placeholder` | string | Placeholder для ввода | 'Введите сообщение...' |
| `welcomeMessage` | string | Приветственное сообщение | 'Добро пожаловать!' |
| `operatorName` | string | Имя оператора по умолчанию | 'Оператор' |
| `operatorAvatar` | string | URL аватара оператора | - |
| `autoLoad` | boolean | Автозагрузка при инициализации | true |
| `minimizeOnStart` | boolean | Свернуть при запуске | false |

### Переменные окружения

Создайте `.env` файл на основе `.env.example`:

```bash
# API Configuration
VITE_API_URL=http://localhost:3004
VITE_WS_URL=http://localhost:3004

# Widget Default Settings
VITE_WIDGET_PRIMARY_COLOR=#3b82f6
VITE_WIDGET_THEME=light
VITE_WIDGET_POSITION=bottom-right
VITE_WIDGET_OPERATOR_NAME=Оператор поддержки
VITE_WIDGET_WELCOME_MESSAGE=Добро пожаловать! Как могу помочь?
VITE_WIDGET_PLACEHOLDER=Введите сообщение...

# Features
VITE_WIDGET_ALLOW_FILE_UPLOAD=true
VITE_WIDGET_ALLOW_COMPLAINT=true
VITE_WIDGET_ALLOW_RATING=true
VITE_WIDGET_MAX_FILE_SIZE=10485760
```

## 🏗️ Архитектура

```
src/
├── components/          # React компоненты
│   ├── ChatWidget.tsx   # Основной компонент виджета
│   ├── RatingModal.tsx  # Модальное окно рейтинга
│   ├── ComplaintModal.tsx # Модальное окно жалоб
│   └── UI/             # UI компоненты
├── stores/             # Zustand stores
│   ├── authStore.ts    # Управление авторизацией
│   └── widgetStore.ts  # Состояние виджета
├── hooks/              # React hooks
│   ├── useApiCall.ts   # API вызовы
│   └── useSocketIO.ts  # WebSocket подключения
├── core.ts             # Централизованная логика API
├── types.ts            # TypeScript типы
└── widget.tsx          # Entry point для встраивания
```

### Ключевые файлы

- **`core.ts`** - Централизованный модуль для всех API запросов и WebSocket подключений
- **`authStore.ts`** - Управление JWT авторизацией и анонимными сессиями
- **`widgetStore.ts`** - Состояние виджета (сообщения, операторы, UI)
- **`ChatWidget.tsx`** - Основной компонент с полной логикой чата
- **`widget.tsx`** - Entry point для встраивания на сайты

## 🔌 Backend API

Виджет работает со следующими API endpoints:

### Авторизация
- `GET /auth/me` - Проверка токена
- `POST /auth/login` - Авторизация
- `POST /auth/register` - Регистрация
- `POST /auth/logout` - Выход

### Чат (публичные)
- `POST /public/chat/conversations` - Создание беседы
- `GET /public/chat/conversations/:id` - Получение беседы
- `GET /public/chat/conversations/:id/messages` - Сообщения
- `POST /public/chat/conversations/:id/messages` - Отправка сообщения
- `PUT /public/chat/conversations/:id/read` - Отметить как прочитанное

### Операторы
- `GET /public/users/operators` - Список операторов

### Рейтинги и жалобы
- `POST /ratings` - Создание рейтинга
- `POST /complaints` - Создание жалобы

### WebSocket события
- `join-room` - Присоединение к комнате
- `send-message` - Отправка сообщения
- `new_message` - Получение сообщения
- `typing` - Статус набора текста
- `operator_status` - Статус оператора

## 🛠️ Разработка

### Требования
- Node.js 18+
- npm или yarn

### Команды разработки

```bash
npm run dev          # Запуск dev сервера на порту 3005
npm run build        # Сборка для продакшена
npm run build:widget # Сборка виджета
npm run preview      # Предпросмотр сборки
npm run lint         # Линтинг кода
```

### Структура сборки

После `npm run build` в папке `dist/` будут:

```
dist/
├── index.html           # Demo страница
├── chat-widget.js       # Встраиваемый виджет
├── chat-widget.css      # Стили виджета
├── main-[hash].js       # Основная demo страница
└── assets/              # Другие ресурсы
```

## 🚀 Деплой на Vercel

### Подготовка к деплою

1. **Соберите проект:**
```bash
npm run build
```

2. **Проверьте файлы сборки:**
После сборки в папке `dist/` должны появиться:
- `chat-widget.iife.js` - основной файл виджета
- `chat-widget.css` - стили виджета

### Настройки Vercel

1. **Build Command:** `npm run build`
2. **Output Directory:** `dist`
3. **Node.js Version:** 18.x или выше

### Environment Variables для Vercel

Установите в настройках Vercel:

```
VITE_API_URL=https://chat-backend-13tr.onrender.com
VITE_DEBUG=false
NODE_ENV=production
```

### Использование после деплоя

После деплоя виджет будет доступен по адресу:
```
https://your-vercel-app.vercel.app/chat-widget.iife.js
https://your-vercel-app.vercel.app/chat-widget.css
```

Для встраивания на сайт используйте:

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="https://your-vercel-app.vercel.app/chat-widget.css">
</head>
<body>
    <!-- Ваш контент -->
    
    <script src="https://your-vercel-app.vercel.app/chat-widget.iife.js"></script>
    <script>
        // Инициализация виджета
        if (window.ChatWidget) {
            window.ChatWidget.initChatWidget({
                apiUrl: 'https://chat-backend-13tr.onrender.com',
                theme: 'light',
                position: 'bottom-right'
            });
        }
    </script>
</body>
</html>
```

### Ручной деплой

1. **Разместите файлы на вашем сервере:**
   - `chat-widget.iife.js` и `chat-widget.css` должны быть доступны по HTTP
   - Настройте CORS для доменов, где будет использоваться виджет

2. **Обновите конфигурацию:**
   - Установите правильный `apiUrl` в конфигурации виджета
   - Убедитесь, что backend API доступен и настроен

## 📱 Совместимость

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers

## 🔒 Безопасность

- JWT токены для авторизованных пользователей
- Анонимные сессии для неавторизованных
- Валидация на стороне сервера
- CORS настройки
- Rate limiting (на стороне API)

## 🆘 Поддержка

Для получения помощи:
1. Проверьте console браузера на ошибки
2. Убедитесь, что backend API доступен
3. Проверьте CORS настройки
4. Убедитесь в правильности конфигурации

## 📄 Лицензия

MIT License