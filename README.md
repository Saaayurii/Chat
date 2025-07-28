# 💬 Chat - Корпоративная система консультаций

Полнофункциональная корпоративная система консультаций с real-time чатом, системой ролей, автоматическим распределением чатов между операторами и встраиваемым виджетом для веб-сайтов.

## 🎯 Основные возможности

### 👥 Мультиролевая система
- **Администратор:** Полное управление системой и пользователями
- **Оператор:** Обработка запросов пользователей и консультации  
- **Посетитель:** Получение консультаций через встраиваемый виджет

### 🚀 Технологический стек
- **Backend:** NestJS + TypeScript + MongoDB + Redis + Socket.IO
- **Admin Panel:** Next.js 15 + TypeScript + Tailwind CSS + Shadcn/ui
- **Widget:** React + TypeScript + Vite (встраиваемый виджет)
- **Real-time:** WebSocket + Redis pub/sub для масштабирования
- **Аутентификация:** JWT + Email подтверждение через Resend
- **Тестирование:** Jest + React Testing Library (90%+ покрытие)

### ⚡ Ключевые функции
- 🔄 **Автоматическое распределение** чатов между операторами
- 📞 **Система передачи чатов** между операторами с уведомлениями
- 🎯 **Smart queue management** с приоритизацией
- 📊 **Real-time аналитика** и статистика работы
- 🛡️ **Система жалоб и блокировки** пользователей
- ⭐ **Рейтинговая система** для операторов
- 📧 **Email уведомления** для всех событий системы
- 🔐 **Enterprise-grade безопасность** с rate limiting
- 🌐 **Cross-tab синхронизация** для операторов
- 📱 **Responsive design** для всех устройств

---

## 🚀 Быстрый старт

### 1. Клонирование и установка

```bash
# Клонируйте репозиторий
git clone <repository-url>
cd Chat

# Установите зависимости backend
cd backend
npm install

# Установите зависимости admin-panel
cd ../admin-panel
npm install

# Установите зависимости widget
cd ../widget
npm install
```

### 2. Настройка окружения

#### Backend (.env)
```env
# 🗄️ База данных
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/chatdb

# 🔐 JWT секреты (используйте криптографически стойкие ключи!)
JWT_SECRET=8f2a3b4c5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z8a9b0c1d2e3f4g5h
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=9e3f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v0w1x2y3z4a5b6c7d8e9f0g1h2i3j4k5l6m
REFRESH_TOKEN_EXPIRES_IN=7d
COOKIE_SECRET=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456

# 📧 Email сервис (Resend)
RESEND_API_KEY=re_your_resend_api_key_here
FROM_EMAIL=onboarding@resend.dev

# 🔴 Redis Configuration
REDIS_HOST=redis-host.com
REDIS_PORT=15700
REDIS_PASSWORD=your-redis-password
REDIS_DB=0
REDIS_URL=redis://default:password@host:port

# 🌐 Application URLs
CLIENT_URL=http://localhost:3000
WIDGET_URL=http://127.0.0.1:5500
ADMIN_PANEL_URL=http://localhost:3001
SERVER_PORT=3004

# 🔒 Security Settings
NODE_ENV=development
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000  # 15 минут
RATE_LIMIT_MAX_REQUESTS=100   # 100 запросов за 15 минут

# 📚 Documentation
API_DOCUMENTATION=http://localhost:3004/api-docs
```

#### Admin Panel (.env)
```env
NEXT_PUBLIC_API_URL=http://localhost:3004
NEXT_PUBLIC_WS_URL=http://localhost:3004
NEXT_PUBLIC_SOCKET_URL=http://localhost:3004
```

#### Widget (.env)
```env
VITE_API_URL=http://localhost:3004
VITE_WS_URL=http://localhost:3004
```

### 3. Запуск сервисов

#### Запуск через Docker (рекомендуется)
```bash
cd backend
docker-compose up -d
```

#### Ручной запуск для разработки
```bash
# 1. Запуск Redis (требуется для backend)
redis-server

# 2. Запуск backend (NestJS API)
cd backend
npm run start:dev

# 3. Запуск admin-panel (Next.js)
cd ../admin-panel
npm run dev

# 4. Запуск widget (Vite) для тестирования
cd ../widget
npm run dev
```

### 📍 Доступные адреса

- **Backend API:** `http://localhost:3004`
- **Admin Panel:** `http://localhost:3000` (админы и операторы)
- **Widget Dev:** `http://localhost:5173` (для разработки виджета)
- **API Documentation:** `http://localhost:3004/api-docs` (Swagger)
- **Widget Example:** `http://localhost:5173/example.html` (тестовая страница)

### 4. Первоначальная настройка

#### Создание администратора
```bash
cd backend
npm run seed  # Создает тестовых пользователей и данные
```

#### Тестовые аккаунты после seeding:
- **Admin:** admin@example.com / password123
- **Operator:** operator@example.com / password123
- **User:** user@example.com / password123

---

## 🏗️ Архитектура системы

### 🗄️ Структура проекта
```
Chat/
├── backend/              # NestJS API сервер
├── admin-panel/          # Next.js админ-панель
├── widget/              # React виджет для встраивания
├── frontend/            # Legacy HTML/JS интерфейсы (deprecated)
└── docs/                # Документация проекта
```

### 🎯 Backend (NestJS + TypeScript)
```
backend/
├── src/
│   ├── auth/                    # 🔐 JWT аутентификация и авторизация
│   │   ├── dto/                 # Data Transfer Objects
│   │   ├── strategies/          # Passport стратегии (JWT, Local)
│   │   └── interfaces/          # Интерфейсы ответов
│   ├── users/                   # 👥 Управление пользователями
│   │   ├── dto/                 # DTO для CRUD операций
│   │   └── interfaces/          # Интерфейсы пользователей
│   ├── chat/                    # 💬 Real-time чат система
│   │   ├── dto/                 # WebSocket и REST DTO
│   │   ├── events/              # Socket.IO события
│   │   ├── conversations.service.ts  # Управление беседами
│   │   └── messages.service.ts       # Управление сообщениями
│   ├── transfer/                # 🔄 Система передачи чатов
│   │   ├── dto/                 # DTO для передачи
│   │   ├── interfaces/          # Интерфейсы очереди и передач
│   │   ├── schemas/             # MongoDB схемы
│   │   └── guards/              # Права доступа к передачам
│   ├── questions/               # ❓ Система вопросов и тикетов
│   ├── complaints/              # 📢 Система жалоб на операторов
│   ├── ratings/                 # ⭐ Рейтинговая система
│   ├── blacklist/               # 🚫 Система блокировки пользователей
│   ├── email/                   # 📧 Email уведомления через Resend
│   ├── common/                  # 🔧 Общие компоненты
│   │   ├── services/            # Redis, кэширование, уведомления
│   │   │   ├── redis.service.ts        # Redis интеграция
│   │   │   ├── presence.service.ts     # Система присутствия
│   │   │   ├── notification.service.ts # Push уведомления
│   │   │   └── message-cache.service.ts # Кэширование сообщений
│   │   ├── guards/              # Защитники маршрутов
│   │   │   ├── auth.guard.ts           # JWT авторизация
│   │   │   ├── roles.guard.ts          # Проверка ролей
│   │   │   ├── rate-limit.guard.ts     # Rate limiting
│   │   │   └── ws-auth.guard.ts        # WebSocket авторизация
│   │   ├── decorators/          # Кастомные декораторы
│   │   ├── pipes/               # Валидация данных
│   │   ├── filters/             # Обработка исключений
│   │   └── interceptors/        # Логирование и трансформация
│   ├── database/                # 🗄️ MongoDB конфигурация
│   │   └── schemas/             # Mongoose схемы
│   ├── config/                  # ⚙️ Конфигурация приложения
│   ├── seeders/                 # 🌱 Заполнение БД тестовыми данными
│   └── health/                  # 🏥 Health checks для мониторинга
├── test/                        # 🧪 E2E тесты
├── docker-compose.yml           # 🐳 Docker оркестрация
├── nginx/                       # 🌐 Reverse proxy конфигурация
└── scripts/                     # 📝 Скрипты деплоя и утилиты
```

### 🎨 Admin Panel (Next.js 15 + TypeScript)
```
admin-panel/
├── src/
│   ├── app/                     # 📱 Next.js App Router
│   │   ├── admin/               # 👑 Админ интерфейс
│   │   │   ├── chat/            # Админ чат с мониторингом
│   │   │   ├── users/           # Управление операторами
│   │   │   ├── visitors/        # Управление посетителями
│   │   │   ├── blacklist/       # Управление блокировками
│   │   │   ├── complaints/      # Обработка жалоб
│   │   │   ├── ratings/         # Мониторинг рейтингов
│   │   │   ├── questions/       # Управление вопросами
│   │   │   ├── statistics/      # Аналитика и отчеты
│   │   │   └── emails/          # Email уведомления
│   │   ├── operator/            # 👨‍💼 Интерфейс оператора
│   │   │   ├── chat/            # Основной чат оператора
│   │   │   ├── colleagues/      # Список коллег онлайн
│   │   │   ├── questions/       # Назначенные вопросы
│   │   │   ├── ratings/         # Личные рейтинги
│   │   │   └── statistics/      # Личная статистика
│   │   ├── chat/                # 💬 Основной чат (универсальный)
│   │   ├── login/               # 🔑 Авторизация
│   │   ├── registration/        # 📝 Регистрация
│   │   ├── profile/             # 👤 Профиль пользователя
│   │   └── settings/            # ⚙️ Настройки
│   ├── components/              # 🧩 React компоненты
│   │   ├── Chat/                # Чат компоненты
│   │   │   ├── ChatSidebar.tsx         # Боковая панель чатов
│   │   │   ├── UserInfoSidebar.tsx     # Информация о пользователе
│   │   │   ├── MessageInput.tsx        # Поле ввода сообщений
│   │   │   ├── TransferModal.tsx       # Модал передачи чата
│   │   │   ├── TransferRequestModal.tsx # Запросы на передачу
│   │   │   └── BlockUserModal.tsx      # Блокировка пользователя
│   │   ├── Presence/            # 🟢 Система присутствия
│   │   │   ├── OnlineUsersList.tsx     # Список онлайн пользователей
│   │   │   ├── PresenceIndicator.tsx   # Индикатор статуса
│   │   │   ├── PresenceAvatar.tsx      # Аватар со статусом
│   │   │   └── usePresence.ts          # Хук управления присутствием
│   │   ├── Blacklist/           # 🚫 Управление блокировками
│   │   ├── Ratings/             # ⭐ Компоненты рейтингов
│   │   ├── Questions/           # ❓ Управление вопросами
│   │   ├── Complaints/          # 📢 Обработка жалоб
│   │   ├── Email/               # 📧 Email компоненты
│   │   ├── UI/                  # 🎨 Shadcn/ui компоненты
│   │   └── Layout/              # 📐 Компоненты макета
│   ├── hooks/                   # 🪝 Кастомные React хуки
│   │   ├── useChat.ts                  # WebSocket чат
│   │   ├── useSocketIO.ts              # Socket.IO клиент
│   │   ├── useApiCall.ts               # API запросы
│   │   ├── useNotifications.ts         # Push уведомления
│   │   ├── usePagination.ts            # Пагинация
│   │   └── usePresence.ts              # Система присутствия
│   ├── contexts/                # 🌐 React контексты
│   │   ├── UnreadMessagesContext.tsx   # Непрочитанные сообщения
│   │   └── UIContext.tsx               # UI состояние
│   ├── store/                   # 🏪 Zustand стор
│   │   └── authStore.ts                # Состояние авторизации
│   ├── core/                    # 🔧 API интеграция
│   │   └── api.ts                      # HTTP клиент
│   ├── types/                   # 📝 TypeScript типы
│   └── test-utils/              # 🧪 Утилиты для тестирования
└── public/                      # 📁 Статичные файлы
```

### 🎛️ Widget (React + Vite)
```
widget/
├── src/
│   ├── components/              # 🧩 Widget компоненты
│   │   ├── ChatWidget.tsx              # Основной виджет чата
│   │   ├── AuthModal.tsx               # Модал авторизации
│   │   ├── ProfileModal.tsx            # Профиль пользователя
│   │   ├── RatingModal.tsx             # Оценка оператора
│   │   ├── ComplaintModal.tsx          # Подача жалобы
│   │   └── UI/                         # UI компоненты
│   ├── hooks/                   # 🪝 Widget хуки
│   │   ├── useSocketIO.ts              # WebSocket подключение
│   │   └── useApiCall.ts               # API вызовы
│   ├── stores/                  # 🏪 Zustand сторы
│   │   ├── authStore.ts                # Авторизация виджета
│   │   └── widgetStore.ts              # Состояние виджета
│   ├── widget.tsx               # 🎯 Точка входа виджета
│   ├── main.tsx                 # 🚀 Development сервер
│   └── types.ts                 # 📝 Типы виджета
├── dist/                        # 📦 Сборка для продакшена
├── public/                      # 📁 Статичные файлы
│   └── example.html                    # Пример интеграции
└── vite.config.widget.ts        # ⚙️ Конфигурация сборки
```

---

## 🎯 Детальные возможности системы

### 👥 Мультиролевая система доступа

#### 👑 Администратор
- **Управление пользователями:** Создание, редактирование, удаление операторов
- **Система блокировки:** Одобрение/отклонение запросов на блокировку от операторов
- **Аналитика и отчеты:** Полная статистика работы системы, операторов, конверсий
- **Управление жалобами:** Рассмотрение жалоб на операторов с системой предупреждений
- **Email рассылки:** Настройка и отправка массовых уведомлений
- **Мониторинг системы:** Real-time просмотр всех чатов и активности
- **Управление рейтингами:** Скрытие неподходящих отзывов, модерация комментариев

#### 👨‍💼 Оператор  
- **Чат с посетителями:** Обработка входящих запросов через единый интерфейс
- **Система передач:** Передача сложных чатов коллегам с указанием причины
- **Управление очередью:** Автоматическое получение новых чатов по availability
- **Предложения блокировки:** Отправка запросов админу на блокировку нарушителей
- **Личная статистика:** Просмотр своих метрик, рейтингов, времени ответа
- **Система присутствия:** Управление статусом (онлайн/оффлайн/занят)
- **Коллаборация:** Просмотр онлайн коллег, внутренний чат (планируется)

#### 🌐 Посетитель (через виджет)
- **Анонимный чат:** Общение без регистрации с автогенерацией сессии
- **Регистрация профиля:** Создание постоянного аккаунта для истории чатов
- **Оценка операторов:** 5-звездочная система с детализированными критериями
- **Подача жалоб:** Механизм жалоб на некорректное поведение операторов
- **История переписки:** Доступ к предыдущим чатам (для зарегистрированных)
- **Файловые вложения:** Отправка скриншотов и документов (планируется)

### 🔐 Enterprise-grade безопасность

#### Аутентификация
- **JWT токены:** Короткий TTL (15 минут) для access токенов
- **Refresh токены:** Долгосрочные (7 дней) с безопасным хранением в httpOnly cookies
- **Email верификация:** Обязательная через Resend API с шаблонами
- **Двухфакторная аутентификация:** Поддержка 2FA через email (планируется SMS)
- **Роль-основанная авторизация:** RBAC с гранулярными правами доступа

#### Защита API
- **Rate limiting:** Настраиваемые лимиты по IP и пользователю (100 req/15min)
- **Input validation:** Полная валидация через class-validator + DTO
- **SQL Injection защита:** MongoDB + Mongoose ODM
- **XSS защита:** Sanitization входящих данных
- **CORS настройки:** Whitelist разрешенных доменов
- **Security headers:** Helmet.js с настройками CSP

#### Мониторинг и логирование
- **Structured logging:** Pino для высокой производительности
- **Request tracing:** Correlation IDs для отслеживания запросов
- **Error tracking:** Централизованная обработка ошибок
- **Security events:** Логирование подозрительной активности

### 💬 Advanced Real-time система

#### WebSocket архитектура
- **Socket.IO сервер:** Auto-fallback на polling при проблемах с WebSocket
- **Redis adapter:** Горизонтальное масштабирование на несколько серверов
- **Connection pooling:** Оптимизированное управление соединениями
- **Heartbeat monitoring:** Автоматическое переподключение при разрывах
- **Message queue:** Доставка сообщений при временном отключении

#### Real-time функции
- **Typing indicators:** "Пользователь печатает..." с таймаутом
- **Online presence:** Статус пользователей в реальном времени
- **Message delivery:** Статусы доставлено/прочитано с timestamps
- **Cross-tab sync:** Синхронизация между вкладками браузера
- **Push notifications:** Browser notifications для операторов
- **Sound alerts:** Звуковые уведомления о новых сообщениях
- **Auto-scroll:** Умная прокрутка с кнопкой "к последнему сообщению"

#### Система присутствия (Presence)
- **Status management:** Онлайн/Оффлайн/Занят/Отошел с автосменой
- **Activity tracking:** Отслеживание последней активности
- **Idle detection:** Автоматический перевод в "Отошел" при бездействии
- **Multi-device sync:** Синхронизация статуса между устройствами

### 🔄 Intelligent система передачи чатов

#### Smart Queue Management
- **Алгоритм распределения:** Round-robin с учетом загрузки операторов
- **Приоритизация:** VIP клиенты, сложность запроса, время ожидания
- **Load balancing:** Равномерное распределение нагрузки между операторами
- **Queue monitoring:** Real-time отслеживание позиции в очереди
- **SLA tracking:** Мониторинг времени ответа и эскалация при превышении

#### Transfer Workflow
- **Manual transfers:** Оператор выбирает коллегу + указывает причину передачи
- **Auto-assignment:** Система автоматически находит доступного оператора
- **Transfer requests:** Уведомления получателю с возможностью принять/отклонить
- **Context preservation:** Полная история чата передается вместе с беседой
- **Handoff notifications:** Уведомления клиенту о смене оператора

#### Analytics & Reporting
- **Transfer statistics:** Количество передач, причины, успешность
- **Operator performance:** Время обработки, качество решений
- **Queue analytics:** Среднее время ожидания, пиковые нагрузки
- **Escalation tracking:** Отслеживание эскалированных запросов

### 📊 Продвинутая аналитика и Business Intelligence

#### Real-time Dashboard
- **Live metrics:** Активные чаты, операторы онлайн, время ответа
- **Performance KPIs:** SLA соблюдение, NPS, CSAT, resolution time
- **Revenue tracking:** Конверсия из чатов, ROI от операторов
- **Alert system:** Автоматические уведомления при критических событиях

#### Operator Analytics
- **Individual scorecards:** Рейтинги, отзывы, время ответа по операторам
- **Performance trends:** Графики производительности за периоды
- **Workload distribution:** Равномерность распределения нагрузки
- **Training insights:** Выявление потребностей в дополнительном обучении

#### Customer Analytics  
- **Satisfaction metrics:** Детальная аналитика по оценкам и отзывам
- **Behavior patterns:** Анализ путей пользователей, популярные запросы
- **Retention analysis:** Повторные обращения, лояльность клиентов
- **Complaint analysis:** Тренды жалоб, топ проблемные области

#### System Performance
- **Infrastructure monitoring:** CPU, RAM, Redis производительность
- **Response time tracking:** API endpoints, WebSocket латентность  
- **Error rate analysis:** 4xx/5xx ошибки, failed requests
- **Capacity planning:** Прогнозирование нагрузки и масштабирования

### 🎨 Production-ready встраиваемый виджет

#### Техническая реализация
- **Standalone bundle:** Единый JS файл без внешних зависимостей
- **Lazy loading:** Асинхронная загрузка для минимального влияния на сайт
- **Shadow DOM:** Изоляция стилей от родительского сайта
- **TypeScript:** Полная типизация для лучшей поддержки
- **Tree shaking:** Оптимизированный размер бандла (< 100KB gzipped)

#### Customization & Branding
- **Темизация:** Настройка цветов, шрифтов, размеров под бренд
- **Позиционирование:** Выбор угла экрана, отступы, анимации
- **Локализация:** Поддержка множественных языков
- **Custom CSS:** Возможность переопределения стилей
- **Brand assets:** Загрузка логотипов, аватаров операторов

#### Integration Features
- **One-line install:** `<script>` тег с автоинициализацией
- **Configuration API:** JavaScript API для программной настройки
- **Event callbacks:** Hooks на открытие/закрытие, новые сообщения
- **SSR compatibility:** Работа с Next.js, Nuxt, Gatsby
- **CDN delivery:** Быстрая загрузка через глобальный CDN

#### Advanced Widget Features
- **Pre-chat forms:** Сбор контактных данных перед началом чата
- **Business hours:** Отображение расписания работы поддержки
- **Offline messaging:** Форма обратной связи когда операторы оффлайн
- **File uploads:** Загрузка скриншотов и документов
- **Chat transcripts:** Email отправка истории переписки
- **GDPR compliance:** Согласие на обработку данных

### 🛡️ Comprehensive система блокировки и модерации

#### Процесс блокировки
- **Operator proposals:** Операторы предлагают блокировки с обоснованием
- **Admin approval:** Двухступенчатая система одобрения администраторами
- **Evidence collection:** Прикрепление скриншотов чатов как доказательств
- **Severity levels:** Градация нарушений (низкая/средняя/высокая/критическая)
- **Appeal process:** Механизм обжалования блокировок пользователями

#### Типы блокировок
- **Temporary blocks:** Временные блокировки с автоматическим снятием
- **Permanent bans:** Постоянные блокировки для серьезных нарушений
- **IP-based blocking:** Блокировка по IP адресам и подсетям
- **Behavioral patterns:** AI-детекция подозрительного поведения
- **Escalation rules:** Автоматическое ужесточение при повторных нарушениях

#### Причины блокировок
- **Spam/Flooding:** Массовая рассылка сообщений
- **Inappropriate content:** Неподобающий контент, нецензурная лексика
- **Harassment:** Преследование операторов или других пользователей
- **Fraud attempts:** Попытки мошенничества или социальной инженерии
- **ToS violations:** Нарушения пользовательского соглашения
- **Custom reasons:** Настраиваемые причины под специфику бизнеса

---

## 🔧 Comprehensive API Reference

### 🔐 Authentication & Authorization (`/auth`)
```http
# Регистрация и авторизация
POST   /auth/register              # Регистрация нового пользователя
POST   /auth/login                 # Авторизация пользователя
POST   /auth/logout                # Выход из системы
POST   /auth/refresh               # Обновление access токена

# Управление паролем
POST   /auth/forgot-password       # Запрос сброса пароля
POST   /auth/reset-password        # Сброс пароля по токену
PUT    /auth/change-password       # Смена пароля авторизованным пользователем

# Email верификация
POST   /auth/confirm-email         # Подтверждение email по токену
POST   /auth/resend-confirmation   # Повторная отправка письма подтверждения

# Профиль
GET    /auth/me                    # Получение текущего пользователя
PUT    /auth/profile               # Обновление профиля
POST   /auth/upload-avatar         # Загрузка аватара

# Двухфакторная аутентификация (планируется)
POST   /auth/2fa/enable            # Включение 2FA
POST   /auth/2fa/verify            # Верификация 2FA кода
POST   /auth/2fa/disable           # Отключение 2FA
```

### 👥 User Management (`/users`)
```http
# CRUD операции (только для админов)
GET    /users                      # Список всех пользователей (пагинация + фильтры)
POST   /users                      # Создание нового пользователя
GET    /users/:id                  # Получение пользователя по ID
PUT    /users/:id                  # Обновление пользователя
DELETE /users/:id                  # Мягкое удаление пользователя
PATCH  /users/:id/restore          # Восстановление удаленного пользователя

# Управление ролями и статусами
PATCH  /users/:id/role              # Изменение роли пользователя
PATCH  /users/:id/status            # Блокировка/разблокировка пользователя
PATCH  /users/:id/activate          # Активация аккаунта

# Операторы и передачи
GET    /users/operators             # Список доступных операторов
GET    /users/operators/online      # Операторы онлайн для передач
GET    /users/:id/stats             # Статистика конкретного оператора
GET    /users/:id/ratings           # Рейтинги оператора

# Публичные эндпоинты (для виджета)
GET    /public/users/operators      # Публичный список операторов для виджета
```

### 💬 Chat System (`/chat` + WebSocket)

#### REST API Endpoints
```http
# Управление беседами
GET    /chat/conversations          # Список бесед пользователя
POST   /chat/conversations          # Создание новой беседы
GET    /chat/conversations/:id      # Получение конкретной беседы
DELETE /chat/conversations/:id      # Закрытие беседы
PATCH  /chat/conversations/:id/archive # Архивирование беседы

# Сообщения
GET    /chat/conversations/:id/messages     # История сообщений (пагинация)
POST   /chat/conversations/:id/messages     # Отправка сообщения
PUT    /chat/messages/:id                   # Редактирование сообщения
DELETE /chat/messages/:id                   # Удаление сообщения
PATCH  /chat/messages/:id/read              # Отметка как прочитанное

# Файловые вложения
POST   /chat/upload                         # Загрузка файла
GET    /chat/files/:id                      # Получение файла
DELETE /chat/files/:id                      # Удаление файла

# Анонимный чат (для виджета)
POST   /public/chat/anonymous               # Создание анонимной беседы
POST   /public/chat/anonymous/:id/messages  # Отправка анонимного сообщения
```

#### WebSocket Events (`ws://localhost:3004/chat`)
```javascript
// Подключение к комнате
emit('join-room', { conversationId, userId })

// Отправка сообщений
emit('send-message', { conversationId, text, type, attachments })

// Typing индикаторы
emit('typing-start', { conversationId, userId })
emit('typing-stop', { conversationId, userId })

// Статусы прочтения
emit('mark-as-read', { conversationId, messageIds })

# Incoming events
on('message-received', (message) => {})
on('typing-indicator', ({ userId, isTyping }) => {})
on('message-read', ({ messageId, readBy }) => {})
on('user-joined', ({ userId }) => {})
on('user-left', ({ userId }) => {})
```

### 🔄 Transfer System (`/transfer`)
```http
# Управление очередью
GET    /transfer/queue                    # Состояние очереди передач
GET    /transfer/queue/position/:id       # Позиция в очереди
POST   /transfer/queue/join               # Присоединиться к очереди
DELETE /transfer/queue/leave              # Покинуть очередь

# Передачи чатов
POST   /transfer/initiate                 # Инициировать передачу чата
GET    /transfer/pending                  # Ожидающие запросы передачи
GET    /transfer/:id                      # Детали передачи
POST   /transfer/:id/accept               # Принять передачу
POST   /transfer/:id/reject               # Отклонить передачу
GET    /transfer/history                  # История передач

# Статистика передач
GET    /transfer/stats                    # Общая статистика передач
GET    /transfer/stats/operator/:id       # Статистика по оператору
```

### ❓ Questions & Tickets (`/questions`)
```http
# CRUD операции
GET    /questions                         # Список вопросов (фильтры, пагинация)
POST   /questions                         # Создать новый вопрос
GET    /questions/:id                     # Получить вопрос по ID
PUT    /questions/:id                     # Обновить вопрос
DELETE /questions/:id                     # Удалить вопрос
PATCH  /questions/:id/status              # Изменить статус вопроса

# Назначение операторов
POST   /questions/:id/assign              # Назначить оператора
POST   /questions/:id/transfer            # Передать другому оператору
POST   /questions/:id/close               # Закрыть вопрос

# Категории и теги
GET    /questions/categories              # Список категорий
POST   /questions/categories              # Создать категорию
GET    /questions/tags                    # Популярные теги
GET    /questions/stats                   # Статистика по вопросам
```

### ⭐ Rating System (`/ratings`)
```http
# Оценки операторов
GET    /ratings                           # Список всех рейтингов
POST   /ratings                           # Создать новую оценку
GET    /ratings/:id                       # Получить конкретную оценку
DELETE /ratings/:id                       # Удалить оценку
PATCH  /ratings/:id/visibility            # Скрыть/показать оценку

# Статистика рейтингов
GET    /ratings/stats                     # Общая статистика рейтингов
GET    /ratings/stats/operator/:id        # Рейтинги конкретного оператора
GET    /ratings/breakdown                 # Детальная разбивка оценок
GET    /ratings/trends                    # Тренды рейтингов по времени

# Модерация (админ)
GET    /ratings/pending                   # Оценки на модерации
POST   /ratings/:id/moderate              # Модерировать оценку
```

### 🚫 Blacklist Management (`/blacklist`)
```http
# Управление блокировками
GET    /blacklist                         # Список заблокированных пользователей
POST   /blacklist                         # Предложить блокировку (оператор)
GET    /blacklist/:id                     # Детали блокировки
DELETE /blacklist/:id                     # Снять блокировку (админ)
PATCH  /blacklist/:id/approve             # Одобрить блокировку (админ)
PATCH  /blacklist/:id/reject              # Отклонить предложение (админ)

# Модерация и одобрение
GET    /blacklist/pending                 # Ожидающие одобрения блокировки  
GET    /blacklist/appeals                 # Апелляции пользователей
POST   /blacklist/:id/appeal              # Подать апелляцию
POST   /blacklist/:id/evidence            # Добавить доказательства

# Статистика блокировок
GET    /blacklist/stats                   # Статистика по блокировкам
GET    /blacklist/reasons                 # Популярные причины блокировок
```

### 📧 Email Notifications (`/email`)
```http
# Массовые рассылки
POST   /email/broadcast                   # Массовая рассылка
GET    /email/templates                   # Список шаблонов
POST   /email/templates                   # Создать шаблон
PUT    /email/templates/:id               # Обновить шаблон
DELETE /email/templates/:id               # Удалить шаблон

# Автоматические уведомления
POST   /email/welcome                     # Приветственное письмо
POST   /email/verification                # Подтверждение email
POST   /email/password-reset              # Сброс пароля
POST   /email/notification                # Уведомление о событии

# История отправок
GET    /email/history                     # История отправленных писем
GET    /email/stats                       # Статистика доставляемости
```

### 📢 Complaints System (`/complaints`)
```http
# Управление жалобами
GET    /complaints                        # Список жалоб (фильтры)
POST   /complaints                        # Подать жалобу
GET    /complaints/:id                    # Детали жалобы
PUT    /complaints/:id                    # Обновить жалобу
DELETE /complaints/:id                    # Удалить жалобу

# Обработка жалоб (админ)
PATCH  /complaints/:id/status             # Изменить статус жалобы
POST   /complaints/:id/resolve            # Разрешить жалобу
POST   /complaints/:id/dismiss            # Отклонить жалобу
POST   /complaints/:id/warn               # Предупредить оператора

# Статистика жалоб
GET    /complaints/stats                  # Статистика по жалобам
GET    /complaints/trends                 # Тренды жалоб
```

### 🏥 Health & Monitoring (`/health`)
```http
# Проверки состояния системы
GET    /health                            # Общее состояние системы
GET    /health/database                   # Состояние MongoDB
GET    /health/redis                      # Состояние Redis
GET    /health/websocket                  # Состояние WebSocket сервера
GET    /health/email                      # Состояние email сервиса

# Метрики производительности
GET    /metrics                           # Prometheus метрики
GET    /metrics/detailed                  # Детальные метрики системы
```

---

## 🛠 Development Workflow & Commands

### 🎯 Backend (NestJS)
```bash
cd backend

# Development
npm run start:dev              # Hot reload режим разработки
npm run start:debug           # Режим отладки с inspector
npm run build                 # Production сборка
npm run start:prod            # Запуск production версии

# Testing
npm run test                  # Unit тесты с Jest
npm run test:watch            # Unit тесты в watch режиме  
npm run test:cov              # Тесты с покрытием кода
npm run test:e2e              # End-to-end тесты
npm run test:debug            # Тесты в debug режиме

# Code Quality
npm run lint                  # ESLint проверка
npm run lint:fix              # Автоисправление ESLint
npm run format                # Prettier форматирование
npm run type-check            # TypeScript проверка типов

# Database
npm run seed                  # Заполнение БД тестовыми данными
npm run seed:prod             # Seeding для production
npm run migration:generate    # Генерация миграций
npm run migration:run         # Применение миграций

# Utilities
npm run docs:generate         # Генерация API документации
npm run clean                 # Очистка dist папки
```

### 🎨 Admin Panel (Next.js)
```bash
cd admin-panel

# Development  
npm run dev                   # Development сервер (порт 3000)
npm run build                 # Production сборка
npm run start                 # Запуск production версии
npm run export                # Статический экспорт

# Testing
npm run test                  # Jest + React Testing Library
npm run test:watch            # Тесты в watch режиме
npm run test:coverage         # Покрытие кода тестами
npm run test:e2e              # Cypress E2E тесты
npm run test:visual           # Visual regression тесты

# Code Quality
npm run lint                  # Next.js ESLint конфигурация
npm run lint:fix              # Автоисправление
npm run type-check            # TypeScript проверка
npm run format                # Prettier форматирование

# Bundle Analysis
npm run analyze               # Анализ размера бандла
npm run bundle-analyzer       # Визуализация бандла
```

### 🎛️ Widget (React + Vite)
```bash
cd widget

# Development
npm run dev                   # Vite dev сервер (порт 5173)
npm run build                 # Production сборка
npm run build:widget          # Сборка встраиваемого виджета
npm run preview               # Предварительный просмотр сборки

# Testing
npm run test                  # Vitest тесты
npm run test:ui               # Vitest UI интерфейс
npm run test:coverage         # Покрытие кода

# Code Quality  
npm run lint                  # ESLint проверка
npm run type-check            # TypeScript проверка
npm run format                # Prettier форматирование

# Widget Specific
npm run serve:widget          # Локальный сервер для тестирования виджета
npm run size-limit            # Проверка размера бандла виджета
```

### 🐳 Docker Operations
```bash
# Development Environment
docker-compose up -d                    # Запуск всех сервисов
docker-compose up -d --build            # Пересборка и запуск
docker-compose down                     # Остановка всех сервисов
docker-compose down -v                  # Остановка + удаление volumes

# Logs & Debugging
docker-compose logs -f backend          # Логи backend сервиса
docker-compose logs -f admin-panel      # Логи админ-панели
docker-compose logs --tail=100 backend  # Последние 100 строк логов

# Service Management
docker-compose restart backend          # Перезапуск конкретного сервиса
docker-compose exec backend bash        # Подключение к контейнеру
docker-compose exec backend npm run seed # Выполнение команд в контейнере

# Production
docker-compose -f docker-compose.prod.yml up -d    # Production запуск
docker-compose -f docker-compose.prod.yml build    # Production сборка
```

### 🔧 Utility Scripts
```bash
# Full Project Setup (root directory)
./scripts/setup.sh               # Первоначальная настройка проекта
./scripts/install-deps.sh        # Установка зависимостей всех модулей
./scripts/check-health.sh        # Проверка состояния всех сервисов

# Development Workflow
./scripts/dev-start.sh           # Запуск всех сервисов для разработки
./scripts/dev-stop.sh            # Остановка dev окружения
./scripts/reset-db.sh            # Сброс и пересоздание БД

# Testing & Quality
./scripts/run-all-tests.sh       # Запуск всех тестов проекта
./scripts/lint-all.sh            # Проверка кода во всех модулях
./scripts/type-check-all.sh      # TypeScript проверка всего проекта

# Deployment
./scripts/build-all.sh           # Сборка всех модулей
./scripts/deploy.sh              # Deployment скрипт
./scripts/backup-db.sh           # Backup базы данных
```

---

## 🧪 Comprehensive Testing Strategy

### 🎯 Backend Testing (90%+ Coverage)

#### Unit Tests (Jest + Supertest)
```bash
# Структура тестов
backend/src/**/*.spec.ts        # Unit тесты рядом с исходным кодом
backend/test/**/*.e2e-spec.ts   # E2E тесты в отдельной папке

# Тестируемые компоненты
- Services (бизнес-логика)      # 95% покрытие
- Controllers (API endpoints)   # 90% покрытие  
- Guards (авторизация)          # 100% покрытие
- Pipes (валидация)             # 95% покрытие
- Gateways (WebSocket)          # 85% покрытие
```

#### Integration Tests
```bash
# API Integration тесты
- Authentication flow           # Login, register, refresh
- CRUD operations              # Users, chats, ratings
- File upload/download         # Attachments, avatars
- WebSocket connections        # Real-time messaging
- Email notifications          # Resend integration
- Database operations          # MongoDB queries
```

#### E2E Testing
```bash
# Complete user workflows
- User registration + email verification
- Chat conversation flow (visitor → operator)
- Transfer chat between operators  
- Block user workflow (propose → approve)
- Rating system end-to-end
- Complaint filing and resolution
```

### 🎨 Frontend Testing (85%+ Coverage)

#### Component Testing (React Testing Library)
```bash
admin-panel/src/**/__tests__/   # Тесты компонентов

# Тестируемые области
- UI Components                # Button, Modal, Form элементы
- Chat Components              # MessageInput, ChatSidebar, UserInfo
- Business Components          # RatingsManagement, BlacklistManagement
- Layout Components            # Navbar, AppLayout, ProtectedRoute
```

#### Hook Testing
```bash
# Custom hooks тестирование
- useChat (WebSocket)          # Connection, messaging, presence
- useApiCall (HTTP)            # Loading, error handling, caching  
- usePresence (Status)         # Online/offline detection
- usePagination                # Page navigation, filtering
- useNotifications             # Toast notifications
```

#### Integration & E2E (Cypress)
```bash
cypress/e2e/                   # E2E тесты

# Critical user paths
- Admin login → user management
- Operator chat workflow  
- Transfer request handling
- Block user approval process
- Rating submission and display
```

### 🎛️ Widget Testing (80%+ Coverage)

#### Vitest Unit Tests
```bash
widget/src/**/*.test.ts        # Component и hook тесты

# Widget specific tests
- ChatWidget rendering         # Different states, themes
- Authentication modal         # Login, register flows
- Message sending              # Text, files, emojis
- Rating submission            # 5-star rating component
- Responsive behavior          # Mobile, desktop, tablet
```

#### Cross-browser Testing
```bash
# Browser compatibility
- Chrome (latest)              # Primary target
- Firefox (latest)             # Secondary target
- Safari (latest)              # Mobile Safari support
- Edge (latest)                # Enterprise compatibility
```

### 🚀 Performance Testing

#### Load Testing (Artillery.js)
```bash
# API load tests
artillery/scenarios/           # Load test scenarios

# Test scenarios
- Authentication endpoints     # Login, register stress test
- WebSocket connections        # Concurrent user simulation
- Chat message flooding        # High message volume
- File upload stress          # Multiple concurrent uploads
- Database query performance  # Complex query optimization
```

#### Frontend Performance  
```bash
# Bundle size monitoring
- Admin panel bundle < 2MB     # Code splitting optimization
- Widget bundle < 100KB        # Critical for embedding
- WebSocket memory usage       # Memory leak detection
- React rendering performance  # Component re-render optimization
```

### 🔒 Security Testing

#### Penetration Testing
```bash
# Security test areas
- SQL Injection attempts       # MongoDB injection prevention
- XSS vulnerability scans      # Input sanitization testing
- CSRF protection             # Token validation testing  
- JWT token manipulation      # Token security validation
- File upload security        # Malicious file detection
- Rate limiting bypass        # DDoS protection testing
```

#### Authentication Security
```bash
# Auth security tests
- Password strength validation # Complexity requirements
- JWT expiration handling     # Token refresh security
- Session fixation prevention # Secure session management
- Brute force protection      # Account lockout mechanisms
```

### 📊 Test Automation & CI/CD

#### GitHub Actions Pipeline
```yaml
# .github/workflows/test.yml

# Test matrix
- Unit tests (Node 18, 20)    # Multiple Node versions
- Integration tests           # Database + Redis containers
- E2E tests (Chrome, Firefox) # Cross-browser validation
- Security scans             # Dependency vulnerability checks
- Performance benchmarks     # Regression detection
```

#### Quality Gates
```bash
# Code quality requirements
- Unit test coverage ≥ 90%   # High coverage requirement
- E2E test coverage ≥ 80%    # Critical path coverage
- No high/critical vulnerabilities # Security requirement
- Bundle size within limits   # Performance requirement
- TypeScript strict mode     # Type safety requirement
```

### 🔧 Testing Commands Reference

```bash
# Run all tests across the project
npm run test:all               # All projects unit tests
npm run test:integration       # Integration tests only
npm run test:e2e              # End-to-end tests only
npm run test:performance      # Performance tests
npm run test:security         # Security scans

# Coverage reports
npm run test:coverage         # Generate coverage reports
npm run test:coverage:open    # Open coverage in browser
npm run test:coverage:ci      # CI-friendly coverage output

# Visual testing
npm run test:visual           # Visual regression tests
npm run test:accessibility    # a11y compliance tests
npm run test:lighthouse       # Performance audits
```

---

## 📦 Production Deployment Guide

### 🚀 Current Deployment Status

#### Live Services
- **Backend API:** `https://chat-backend-13tr.onrender.com`
- **Admin Panel:** `https://chat-admin-panel.vercel.app`  
- **Widget CDN:** `https://widget-cdn.your-domain.com` (планируется)
- **API Documentation:** `https://chat-backend-13tr.onrender.com/api-docs`

### 🏗️ Infrastructure Architecture

#### Backend Deployment (Render.com)
```yaml
# render.yaml configuration
services:
  - type: web
    name: chat-backend
    env: node
    plan: starter  # Upgrade to standard for production
    buildCommand: npm ci && npm run build
    startCommand: npm run start:prod
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGO_URI
        fromDatabase:
          name: chat-mongodb
          property: connectionString
      - key: REDIS_URL
        fromDatabase:
          name: chat-redis
          property: connectionString
```

#### Frontend Deployment (Vercel)
```json
// vercel.json configuration
{
  "version": 2,
  "builds": [
    {
      "src": "admin-panel/package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/admin-panel/$1"
    }
  ],
  "env": {
    "NEXT_PUBLIC_API_URL": "https://chat-backend-13tr.onrender.com",
    "NEXT_PUBLIC_WS_URL": "https://chat-backend-13tr.onrender.com"
  }
}
```

### 🐳 Docker Production Setup

#### Multi-stage Production Dockerfile
```dockerfile
# backend/Dockerfile.prod
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS production
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

#### Docker Compose Production
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
      - mongodb
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.prod.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  mongodb:
    image: mongo:6
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
    volumes:
      - mongodb_data:/data/db

volumes:
  redis_data:
  mongodb_data:
```

### ⚙️ Environment Configuration

#### Production Environment Variables
```bash
# Backend (.env.production)
NODE_ENV=production
PORT=3000

# Database
MONGO_URI=mongodb://username:password@host:port/database
REDIS_URL=redis://username:password@host:port

# JWT Security (Generate new secrets!)
JWT_SECRET=$(openssl rand -hex 64)
REFRESH_TOKEN_SECRET=$(openssl rand -hex 64)
COOKIE_SECRET=$(openssl rand -hex 32)

# Email Service
RESEND_API_KEY=re_your_production_api_key
FROM_EMAIL=noreply@yourdomain.com

# CORS Origins
CLIENT_URL=https://yourdomain.com
ADMIN_PANEL_URL=https://admin.yourdomain.com
WIDGET_URL=https://widget.yourdomain.com

# Security Settings
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
LOG_LEVEL=info
PROMETHEUS_METRICS=true
HEALTH_CHECK_TIMEOUT=5000

# File Storage
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=10485760

# SSL/HTTPS
SSL_CERT_PATH=/etc/ssl/certs/yourdomain.crt
SSL_KEY_PATH=/etc/ssl/private/yourdomain.key
```

### 🔒 Security Hardening

#### HTTPS & SSL Configuration
```nginx
# nginx/nginx.prod.conf
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    
    ssl_certificate /etc/nginx/ssl/yourdomain.crt;
    ssl_certificate_key /etc/nginx/ssl/yourdomain.key;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    location / {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 📊 Monitoring & Observability

#### Health Checks
```bash
# Health check endpoints
GET /health              # Overall system health
GET /health/database     # MongoDB connection
GET /health/redis        # Redis connection  
GET /health/websocket    # WebSocket server status
GET /health/email        # Email service status

# Metrics endpoints
GET /metrics             # Prometheus metrics
GET /metrics/detailed    # Detailed performance metrics
```

#### Logging Configuration
```typescript
// backend/src/main.ts - Production logging
if (process.env.NODE_ENV === 'production') {
  app.useLogger(app.get(Logger));
  
  // Log rotation
  const loggerOptions: Params = {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: false,
        translateTime: 'SYS:standard',
        destination: './logs/app.log',
        mkdir: true,
      },
    },
  };
}
```

### 🔄 CI/CD Pipeline

#### GitHub Actions Deployment
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run test:e2e

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Render
        uses: johnbeynon/render-deploy-action@v0.0.8
        with:
          service-id: ${{ secrets.RENDER_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./admin-panel
```

### 🚨 Disaster Recovery

#### Backup Strategy
```bash
# Database backups
mongodump --uri="mongodb://user:pass@host/db" --out="/backups/$(date +%Y%m%d)"

# Redis backups
redis-cli --rdb /backups/dump_$(date +%Y%m%d).rdb

# File uploads backup
tar -czf /backups/uploads_$(date +%Y%m%d).tar.gz /app/uploads

# Automated backup script
#!/bin/bash
# scripts/backup.sh
./backup-mongodb.sh
./backup-redis.sh  
./backup-files.sh
aws s3 sync /backups s3://your-backup-bucket/$(date +%Y%m%d)/
```

#### Recovery Procedures
```bash
# Database restore
mongorestore --uri="mongodb://user:pass@host/db" /backups/20240101/

# Redis restore
redis-cli --rdb dump_20240101.rdb

# Application rollback
git checkout previous-stable-tag
docker-compose up -d --build
```

### 📈 Performance Optimization

#### Production Optimizations
- **Gzip compression:** Nginx level compression
- **Static file caching:** Long-term caching headers
- **Database indexing:** Optimized MongoDB indexes
- **Redis caching:** Aggressive caching strategy
- **CDN delivery:** CloudFlare for widget distribution
- **Image optimization:** WebP format, compression
- **Bundle splitting:** Code splitting for faster loads

---

## 🔍 Мониторинг и логирование

### Comprehensive Logging Strategy

#### Structured Logging (Pino)
```typescript
// Centralized logging configuration
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
    time: () => ({ timestamp: new Date().toISOString() }),
  },
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
});

// Correlation ID tracking
app.use((req, res, next) => {
  req.correlationId = uuidv4();
  logger.info({ correlationId: req.correlationId, method: req.method, url: req.url }, 'Request started');
  next();
});
```

#### Log Categories
- **Authentication Events:** Login attempts, failures, token refresh
- **API Requests:** HTTP method, endpoint, response time, status code
- **WebSocket Events:** Connection, disconnection, message sending
- **Database Operations:** Query performance, connection issues
- **Email Notifications:** Send attempts, delivery status, failures
- **Security Events:** Rate limiting triggers, suspicious activity
- **System Performance:** Memory usage, CPU load, response times

### 🏥 Health Monitoring

#### Health Check Endpoints
```bash
# System health checks
curl https://chat-backend-13tr.onrender.com/health
curl https://chat-backend-13tr.onrender.com/health/database
curl https://chat-backend-13tr.onrender.com/health/redis
curl https://chat-backend-13tr.onrender.com/health/websocket
curl https://chat-backend-13tr.onrender.com/health/email

# Detailed metrics
curl https://chat-backend-13tr.onrender.com/metrics
curl https://chat-backend-13tr.onrender.com/metrics/detailed
```

#### Uptime Monitoring
- **Service availability:** 99.9% uptime target
- **Response time monitoring:** < 200ms API response goal
- **Error rate tracking:** < 1% error rate threshold
- **Real-time alerts:** Slack/Discord notifications for incidents

---

## 🚨 Comprehensive Troubleshooting Guide

### 🔧 Common Issues & Solutions

#### ❌ WebSocket Connection Failures
```bash
# Problem: WebSocket fails to connect from admin panel
# Symptoms: "WebSocket connection to 'wss://chat-admin-panel.vercel.app/socket.io/' failed"

# Solution 1: Check environment variables
# Admin panel should point to backend, not itself
NEXT_PUBLIC_WS_URL=https://chat-backend-13tr.onrender.com  # ✅ Correct
NEXT_PUBLIC_WS_URL=https://chat-admin-panel.vercel.app     # ❌ Wrong

# Solution 2: Verify CORS configuration in backend
const corsOrigins = [
  'https://chat-admin-panel.vercel.app',  # Must include admin panel URL
  process.env.ADMIN_PANEL_URL
];

# Solution 3: Test WebSocket endpoint directly
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  https://chat-backend-13tr.onrender.com/socket.io/
```

#### ❌ Redis Connection Issues
```bash
# Problem: Redis connection failed or timeout
# Symptoms: "Redis connection lost", "ECONNREFUSED 127.0.0.1:6379"

# Diagnosis commands
redis-cli ping                    # Test local Redis connection
redis-cli -h host -p port ping   # Test remote Redis connection
docker logs redis-container      # Check Redis container logs

# Common solutions
1. Check Redis service status: systemctl status redis
2. Verify Redis config: /etc/redis/redis.conf
3. Check network connectivity: telnet redis-host 6379
4. Update connection string: REDIS_URL=redis://user:pass@host:port
5. Check Redis memory usage: redis-cli info memory

# Environment variable format
REDIS_URL=redis://default:password@host:port/database
# Example: redis://default:mypassword@redis-server.com:15700/0
```

#### ❌ MongoDB Connection Problems
```bash
# Problem: Database connection timeout or authentication failed
# Symptoms: "MongoTimeoutError", "Authentication failed"

# Diagnosis
mongosh "mongodb+srv://user:pass@cluster.mongodb.net/test"
# Check connection string format and credentials

# MongoDB Atlas troubleshooting
1. Network Access: Add IP address to whitelist (0.0.0.0/0 for development)
2. Database Access: Verify username/password and permissions
3. Connection String: Ensure correct format and URL encoding
4. Cluster Status: Check if cluster is running and accessible

# Environment variable examples
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
MONGO_URI=mongodb://username:password@localhost:27017/dbname  # Local MongoDB
```

#### ❌ Email Service Failures
```bash
# Problem: Emails not sending via Resend
# Symptoms: "Invalid API key", "Domain not verified"

# Check Resend configuration
1. API Key validation: Test in Resend dashboard
2. Domain verification: Verify sender domain in Resend
3. Rate limits: Check account sending limits
4. Email format: Ensure proper email validation

# Test email sending
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "noreply@yourdomain.com",
    "to": "test@example.com",
    "subject": "Test Email",
    "text": "This is a test email"
  }'

# Common issues
- FROM_EMAIL domain must be verified in Resend
- API key must have sending permissions
- Check spam folders for test emails
- Verify DNS records for custom domains
```

#### ❌ CORS Policy Errors
```bash
# Problem: "blocked by CORS policy" in browser console
# Symptoms: API requests fail from admin panel

# Backend CORS configuration (main.ts)
app.enableCors({
  origin: [
    'https://chat-admin-panel.vercel.app',     # Production admin panel
    'http://localhost:3000',                   # Development admin panel
    process.env.ADMIN_PANEL_URL                # Environment variable
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
});

# Verify CORS headers in response
curl -H "Origin: https://chat-admin-panel.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://chat-backend-13tr.onrender.com/auth/login
```

### 🔍 Debugging Workflows

#### Development Debugging
```bash
# Backend debugging
cd backend
npm run start:debug          # Start with debugging enabled
# Attach debugger to localhost:9229

# Frontend debugging  
cd admin-panel
npm run dev                  # Start development server
# Open browser dev tools, set breakpoints

# Database debugging
# MongoDB Compass: mongodb+srv://...
# Redis GUI: RedisInsight for Redis debugging

# Network debugging
# Use browser Network tab to inspect API calls
# Check request/response headers and status codes
```

#### Production Debugging  
```bash
# Check service health
curl https://chat-backend-13tr.onrender.com/health

# View logs
# Render: Go to service logs in Render dashboard
# Vercel: Use `vercel logs` command or dashboard

# Performance monitoring
curl https://chat-backend-13tr.onrender.com/metrics

# Database connection test
mongosh "your-production-connection-string" --eval "db.adminCommand('ping')"
```

### 🚨 Emergency Procedures

#### Service Outage Response
```bash
# 1. Identify the problem
curl -I https://chat-backend-13tr.onrender.com/health  # Check backend health
curl -I https://chat-admin-panel.vercel.app            # Check frontend

# 2. Check external dependencies
ping mongodb-atlas-server.com        # Database connectivity
ping redis-cloud-server.com          # Redis connectivity
curl https://api.resend.com           # Email service status

# 3. Rollback procedure (if needed)
git checkout previous-stable-commit
# Redeploy via Render/Vercel dashboards

# 4. Database backup and restore
mongodump --uri="production-uri" --out="emergency-backup-$(date +%Y%m%d)"
# If restoration needed:
mongorestore --uri="production-uri" "backup-directory"
```

#### Performance Issues
```bash
# High CPU/Memory usage
# 1. Check system metrics in hosting dashboard
# 2. Analyze slow queries in MongoDB
# 3. Check Redis memory usage
# 4. Review application logs for errors

# Slow API responses
# 1. Enable query profiling in MongoDB
# 2. Check database indexes
# 3. Monitor Redis cache hit rates
# 4. Review API endpoint performance metrics

# WebSocket connection drops
# 1. Check network stability
# 2. Review WebSocket server logs  
# 3. Monitor concurrent connection limits
# 4. Check Redis pub/sub performance
```

### 📞 Support & Contact Information

#### Getting Help
1. **Documentation:** Check this README and API docs first
2. **Logs:** Always include relevant logs when reporting issues
3. **Environment:** Specify if issue is development or production
4. **Reproduction:** Provide steps to reproduce the problem

#### Development Support
- **GitHub Issues:** Create detailed issue reports
- **Email:** relmontovror@gmail.com for critical issues
- **Telegram:** [@Relmontov](https://t.me/Relmontov) for quick questions

#### Emergency Contact
- **Production Issues:** Contact immediately via Telegram
- **Security Issues:** Email with [SECURITY] prefix
- **Database Issues:** Include connection logs and error messages

---

## 📚 Complete Technology Stack

### 🎯 Backend Technologies

#### Core Framework & Language
- **NestJS 10+** - Enterprise Node.js framework with decorators
- **TypeScript 5+** - Full type safety and modern JS features
- **Node.js 18+** - Latest LTS with performance improvements

#### Database & Caching
- **MongoDB 6+** - Document database with Mongoose ODM
- **Redis 7+** - In-memory caching and session storage
- **Mongoose** - Object modeling and schema validation

#### Real-time & Communication
- **Socket.IO 4+** - WebSocket server with fallback support
- **Redis Adapter** - Multi-server WebSocket scaling
- **Resend API** - Reliable email delivery service

#### Authentication & Security
- **Passport.js** - Authentication middleware
- **JWT Tokens** - Stateless authentication
- **Bcrypt** - Password hashing
- **Helmet.js** - Security headers
- **CORS** - Cross-origin request handling
- **Rate Limiting** - DDoS and abuse protection

#### Testing & Quality
- **Jest** - Unit testing framework
- **Supertest** - HTTP testing
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks

### 🎨 Frontend Technologies

#### Admin Panel Stack
- **Next.js 15** - React framework with App Router
- **React 18** - UI library with concurrent features  
- **TypeScript 5+** - Complete type safety
- **Tailwind CSS 4** - Utility-first CSS framework

#### UI & Components
- **Shadcn/ui** - Accessible component library
- **Radix UI** - Unstyled, accessible components
- **Lucide React** - Modern icon library
- **Framer Motion** - Animation library (optional)

#### State Management
- **Zustand** - Lightweight state management
- **TanStack Query** - Server state management
- **React Hook Form** - Form state management
- **Zod** - Schema validation

#### Development Tools
- **Vite** - Fast build tool (for widget)
- **ESLint** - Code linting with Next.js config
- **TypeScript Compiler** - Type checking
- **Jest + RTL** - Testing framework

### 🎛️ Widget Technologies

#### Build & Development
- **Vite 5+** - Ultra-fast build tool
- **React 18** - Core UI library
- **TypeScript** - Type safety
- **PostCSS** - CSS processing

#### Bundle Optimization
- **Rollup** - Production bundling
- **Tree Shaking** - Dead code elimination
- **Code Splitting** - Lazy loading
- **Minification** - Size optimization

### 🏗️ Infrastructure & DevOps

#### Containerization
- **Docker** - Application containerization
- **Docker Compose** - Multi-service orchestration
- **Multi-stage builds** - Optimized production images

#### Deployment Platforms
- **Render.com** - Backend hosting with automatic deploys
- **Vercel** - Frontend hosting with edge optimization
- **MongoDB Atlas** - Managed MongoDB hosting
- **Redis Cloud** - Managed Redis hosting

#### Monitoring & Observability
- **Pino** - High-performance logging
- **Prometheus** - Metrics collection (planned)
- **Health Checks** - Service monitoring endpoints
- **Error Tracking** - Centralized error handling

#### CI/CD Pipeline
- **GitHub Actions** - Automated testing and deployment
- **ESLint** - Code quality gates
- **Jest** - Automated testing
- **TypeScript** - Type checking in CI

### 🔒 Production Infrastructure

#### Security Stack
- **HTTPS/TLS** - Encrypted communication
- **JWT Rotation** - Secure token management
- **Rate Limiting** - Request throttling
- **Input Sanitization** - XSS prevention
- **CORS Policy** - Cross-origin security

#### Performance Optimization
- **Redis Caching** - Response caching
- **Database Indexing** - Query optimization
- **CDN** - Static asset delivery
- **Gzip Compression** - Response compression
- **Bundle Splitting** - Code optimization

### 📱 Cross-Platform Support

#### Browser Compatibility
- **Chrome 90+** - Primary target
- **Firefox 88+** - Full support
- **Safari 14+** - WebKit compatibility
- **Edge 90+** - Chromium-based

#### Device Support
- **Desktop** - Full feature set
- **Tablet** - Responsive design
- **Mobile** - Touch-optimized interface
- **PWA Ready** - Progressive web app support

### 🔧 Development Tools

#### Code Quality
- **ESLint** - JavaScript/TypeScript linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **lint-staged** - Pre-commit linting

#### Testing Tools
- **Jest** - Unit testing
- **React Testing Library** - Component testing
- **Cypress** - E2E testing (planned)
- **Artillery.js** - Load testing

#### Development Experience
- **Hot Module Replacement** - Fast development
- **TypeScript Language Server** - IDE support
- **Source Maps** - Production debugging
- **Auto-imports** - Developer productivity

---

## 🔒 Enterprise Security Framework

### 🛡️ Implemented Security Measures

#### Authentication & Authorization
- **JWT Tokens** - Short-lived access tokens (15 min) + long refresh tokens (7 days)
- **Email Verification** - Mandatory account activation via Resend
- **Password Security** - Bcrypt hashing with 12 rounds + complexity requirements
- **Role-Based Access Control (RBAC)** - Admin, Operator, Visitor permissions
- **Session Management** - Secure HttpOnly cookies for refresh tokens

#### API Security
- **Rate Limiting** - 100 requests per 15 minutes per IP/user
- **Input Validation** - Class-validator + DTO pattern for all endpoints
- **SQL Injection Prevention** - MongoDB + Mongoose ODM protection
- **XSS Protection** - Input sanitization and Content Security Policy
- **CORS Configuration** - Whitelist-based origin control
- **Security Headers** - Helmet.js with comprehensive header setup

#### Infrastructure Security
- **HTTPS Enforcement** - TLS 1.3 with strict transport security
- **Environment Variables** - Secrets managed via hosting platform
- **File Upload Security** - MIME type validation + size limits
- **Database Security** - Connection encryption + credential rotation
- **Redis Security** - Password authentication + encryption in transit

### 🚨 Security Monitoring

#### Logging & Alerting
- **Authentication Events** - Failed login attempts, suspicious activity
- **API Security Events** - Rate limit exceeded, invalid tokens
- **File Upload Events** - Malicious file attempts, size violations
- **System Security Events** - Unauthorized access attempts

### 📋 Security Checklist for Production

#### Pre-Deployment Security
- [ ] **Generate New Secrets** - JWT, cookie, database passwords
- [ ] **Enable HTTPS** - SSL certificates configured and tested
- [ ] **Configure Firewall** - Only necessary ports exposed
- [ ] **Update Dependencies** - All packages at latest secure versions
- [ ] **Security Scan** - Run vulnerability assessment
- [ ] **Backup Strategy** - Automated backups configured
- [ ] **Monitoring Setup** - Security alerts configured

#### Ongoing Security Maintenance
- [ ] **Monthly Security Updates** - Dependencies and platform updates
- [ ] **Quarterly Security Review** - Code audit and penetration testing
- [ ] **Access Review** - User permissions and admin accounts
- [ ] **Log Analysis** - Security event monitoring and analysis
- [ ] **Backup Testing** - Regular restore procedure validation

---

## 🚀 Roadmap & Future Enhancements

### 🎯 Short-term Goals (Q1 2025)
- [ ] **File Attachments** - Image and document support in chat
- [ ] **Voice Messages** - Audio recording and playback
- [ ] **Mobile Apps** - React Native iOS/Android applications
- [ ] **Advanced Analytics** - Real-time dashboards with drill-down
- [ ] **API Rate Limiting** - Per-user and per-endpoint limits
- [ ] **Two-Factor Authentication** - SMS and authenticator app support

### 🌟 Medium-term Vision (Q2-Q3 2025)
- [ ] **AI Integration** - Automated response suggestions for operators
- [ ] **Advanced Routing** - Skills-based chat assignment
- [ ] **Video Chat** - WebRTC integration for face-to-face support
- [ ] **Multilingual Support** - Full internationalization (i18n)
- [ ] **Advanced Reporting** - Custom report builder and exports
- [ ] **Integration APIs** - CRM and helpdesk system integrations

### 🎭 Long-term Aspirations (Q4 2025+)
- [ ] **Machine Learning** - Predictive analytics and smart routing
- [ ] **Microservices Architecture** - Service decomposition for scale
- [ ] **Global CDN** - Multi-region deployment for performance
- [ ] **Advanced Security** - SAML SSO and enterprise authentication
- [ ] **White-label Solution** - Multi-tenant SaaS offering
- [ ] **Enterprise Features** - Advanced compliance and audit trails

---

## 🤝 Contributing & Community

### 🛠️ Development Contribution

#### Getting Started
1. **Fork the repository** and create your feature branch
2. **Follow coding standards** - ESLint + Prettier configurations
3. **Write comprehensive tests** - Unit, integration, and E2E coverage
4. **Update documentation** - Include changes in README and API docs
5. **Submit pull request** - Detailed description with testing evidence

#### Code Standards
- **TypeScript First** - Full type safety required
- **Test Coverage** - Minimum 90% coverage for new features
- **Documentation** - JSDoc comments for all public APIs
- **Security Focus** - Security review for all changes
- **Performance Conscious** - Benchmark critical path changes

### 🐛 Issue Reporting

#### Bug Reports
- **Detailed Description** - Steps to reproduce + expected vs actual behavior
- **Environment Info** - Browser, OS, Node.js versions
- **Log Files** - Relevant console/server logs
- **Screenshots** - Visual issues with screen captures

#### Feature Requests
- **Use Case Description** - Business justification and user value
- **Technical Requirements** - API changes and implementation notes
- **Acceptance Criteria** - Clear definition of completion

---

## 📄 License & Legal

### MIT License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for full details.

#### Commercial Use
- ✅ **Commercial Use** - Free for commercial applications
- ✅ **Modification** - Modify and distribute modified versions
- ✅ **Distribution** - Distribute original or modified versions
- ✅ **Private Use** - Use privately for any purpose

#### Limitations
- ❌ **Liability** - No liability for damages or issues
- ❌ **Warranty** - No warranty provided with the software
- ❌ **Trademark** - License doesn't grant trademark rights

---

## 📞 Support & Contact

### 🆘 Getting Help

#### Community Support
- **GitHub Issues** - Bug reports and feature requests
- **Documentation** - Comprehensive guides and API reference
- **Stack Overflow** - Tag questions with `chat-system-nestjs`

#### Professional Support
- **Email Support** - [relmontovror@gmail.com](mailto:relmontovror@gmail.com)
- **Telegram** - [@Relmontov](https://t.me/Relmontov) for quick questions
- **Consulting** - Custom development and enterprise deployment

#### Emergency Support
- **Production Issues** - 24/7 response via Telegram
- **Security Incidents** - Immediate response with [SECURITY] email prefix
- **System Outages** - Real-time status updates and resolution ETAs

### 🌐 Stay Connected

- **GitHub** - Star the repository for updates
- **LinkedIn** - [Professional Profile](https://linkedin.com/in/your-profile)
- **Blog** - Technical articles and development insights
- **Newsletter** - Monthly updates on features and best practices

---

## 🎖️ Acknowledgments

### 🙏 Special Thanks

- **NestJS Team** - For the incredible framework that powers our backend
- **Vercel Team** - For seamless frontend deployment and optimization
- **MongoDB Team** - For reliable and scalable database solutions
- **Redis Team** - For high-performance caching and pub/sub capabilities
- **Open Source Community** - For the countless libraries that make this possible

### 💼 Professional Recognition

This project represents enterprise-grade software development with:
- **Production-Ready Architecture** - Scalable, maintainable, and secure
- **Modern Technology Stack** - Latest frameworks and best practices
- **Comprehensive Testing** - High coverage with multiple testing strategies
- **Professional Documentation** - Clear, detailed, and constantly updated
- **Security Focus** - Enterprise-level security implementation

---

<div align="center">

### 🚀 **Built with Excellence for Enterprise Success** 🚀

**A complete, production-ready chat consultation system for modern businesses**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10+-red.svg)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15+-black.svg)](https://nextjs.org/)

**⭐ Star this repository if it helped you build something amazing! ⭐**

</div>