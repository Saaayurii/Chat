# 💬 Chat - Корпоративная система консультаций

Полнофункциональная корпоративная система консультаций с real-time чатом, системой ролей, transferring операторов и встраиваемым виджетом.

**Backend:** NestJS + TypeScript + MongoDB + Redis + Socket.IO  
**Frontend:** Next.js 15 + TypeScript + Tailwind CSS + Socket.IO  
**Аутентификация:** JWT + Email подтверждение через Resend  
**Real-time:** WebSocket + Redis pub/sub  
**Виджет:** Встраиваемый JavaScript виджет

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

# Установите зависимости frontend
cd ../frontend2.0
npm install
```

### 2. Настройка окружения

#### Backend (.env)
```env
# 🗄️ База данных
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatdb

# 🔐 JWT секреты
JWT_SECRET=your-64-character-jwt-secret-key-here
REFRESH_TOKEN_SECRET=your-64-character-refresh-secret-key-here
COOKIE_SECRET=your-32-character-cookie-secret-here

# 📧 Email сервис
RESEND_API_KEY=re_your_resend_api_key_here
FROM_EMAIL=noreply@yourdomain.com

# 🔴 Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# 🌐 URLs
CLIENT_URL=http://localhost:3000
SERVER_PORT=3001
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

### 3. Запуск сервисов

#### Запуск через Docker (рекомендуется)
```bash
cd backend
docker-compose up -d
```

#### Ручной запуск
```bash
# Запуск Redis
redis-server

# Запуск backend
cd backend
npm run start:dev

# Запуск frontend
cd frontend2.0
npm run dev
```

**Backend API:** `http://localhost:3001`  
**Frontend:** `http://localhost:3000`  
**API документация:** `http://localhost:3001/api-docs`

---

## 🏗️ Архитектура системы

### Backend (NestJS)
```
backend/
├── src/
│   ├── auth/              # JWT аутентификация
│   ├── users/             # Управление пользователями
│   ├── chat/              # Real-time чат
│   ├── transfer/          # Система передачи чатов
│   ├── questions/         # Система вопросов
│   ├── complaints/        # Система жалоб
│   ├── ratings/           # Система рейтингов
│   ├── blacklist/         # Черный список
│   ├── common/            # Общие компоненты
│   │   ├── services/      # Redis, кэширование, уведомления
│   │   ├── guards/        # Защитники маршрутов
│   │   └── decorators/    # Кастомные декораторы
│   └── database/          # MongoDB схемы
├── docker-compose.yml     # Оркестрация сервисов
├── nginx/                 # Reverse proxy
└── scripts/               # Скрипты деплоя
```

### Frontend (Next.js 15)
```
frontend2.0/
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── admin/         # Админ панель
│   │   ├── operator/      # Интерфейс оператора
│   │   ├── user/          # Пользовательский интерфейс
│   │   └── chat/          # Основной чат
│   ├── components/        # React компоненты
│   │   ├── ChatWidget/    # Виджет чата
│   │   ├── UI/            # Shadcn/ui компоненты
│   │   ├── Presence/      # Система присутствия
│   │   └── Blacklist/     # Управление черным списком
│   ├── hooks/             # Кастомные хуки
│   └── core/              # API интеграция
└── public/widget/         # Встраиваемый виджет
```

---

## 🎯 Ключевые функции

### 👥 Система ролей
- **Администратор:** Полный доступ, управление операторами, статистика
- **Оператор:** Ответы на вопросы, чат с пользователями, передача чатов
- **Посетитель:** Задавать вопросы, чат с операторами, оценки

### 🔐 Аутентификация и безопасность
- ✅ JWT с refresh токенами
- ✅ Email подтверждение через Resend
- ✅ Роль-основанная авторизация
- ✅ Rate limiting
- ✅ Security headers (Helmet)
- ✅ Input validation (class-validator)

### 💬 Real-time чат
- ✅ WebSocket через Socket.IO
- ✅ Redis pub/sub для масштабирования
- ✅ Typing indicators
- ✅ Online/offline presence
- ✅ Message status tracking
- ✅ File attachments
- ✅ Cross-tab synchronization

### 🔄 Система передачи чатов
- ✅ Queue management
- ✅ Automatic operator assignment
- ✅ Manual transfer between operators
- ✅ Transfer history tracking
- ✅ Queue position monitoring

### 📊 Аналитика и мониторинг
- ✅ Real-time статистика
- ✅ Operator performance metrics
- ✅ User engagement tracking
- ✅ System health monitoring
- ✅ Redis caching for performance

### 🎨 Встраиваемый виджет
- ✅ Standalone JavaScript widget
- ✅ Customizable themes
- ✅ Responsive design
- ✅ Easy integration
- ✅ Configuration interface

---

## 🔧 API Endpoints

### 🔐 Authentication (`/auth`)
```
POST /auth/register          # Регистрация
POST /auth/login             # Вход
POST /auth/confirm-email     # Подтверждение email
POST /auth/forgot-password   # Запрос сброса пароля
POST /auth/reset-password    # Сброс пароля
POST /auth/logout            # Выход
POST /auth/refresh           # Обновление токена
GET  /auth/me               # Текущий пользователь
```

### 👥 Users (`/users`)
```
GET    /users               # Список пользователей
POST   /users               # Создать пользователя
GET    /users/:id           # Пользователь по ID
PUT    /users/:id           # Обновить пользователя
DELETE /users/:id           # Удалить пользователя
```

### 💬 Chat (`/chat`)
```
WebSocket: ws://localhost:3001/chat
События: join-room, send-message, typing-start, typing-stop
```

### 🔄 Transfer (`/transfer`)
```
POST /transfer/initiate      # Инициировать передачу
GET  /transfer/queue         # Состояние очереди
POST /transfer/accept        # Принять передачу
POST /transfer/reject        # Отклонить передачу
```

### ❓ Questions (`/questions`)
```
GET    /questions            # Список вопросов
POST   /questions            # Создать вопрос
PUT    /questions/:id        # Обновить вопрос
DELETE /questions/:id        # Удалить вопрос
```

### ⭐ Ratings (`/ratings`)
```
GET    /ratings              # Список рейтингов
POST   /ratings              # Создать рейтинг
PUT    /ratings/:id/hide     # Скрыть рейтинг
GET    /ratings/stats        # Статистика рейтингов
```

### 🚫 Blacklist (`/blacklist`)
```
GET    /blacklist            # Список заблокированных
POST   /blacklist            # Заблокировать пользователя
PUT    /blacklist/:id/approve # Одобрить блокировку
DELETE /blacklist/:id        # Разблокировать
```

---

## 🛠 Команды разработки

### Backend
```bash
cd backend
npm run start:dev      # Режим разработки
npm run build          # Сборка проекта
npm run test           # Запуск тестов
npm run test:e2e       # E2E тесты
npm run lint           # Проверка кода
npm run seed           # Заполнение БД тестовыми данными
```

### Frontend
```bash
cd frontend2.0
npm run dev            # Режим разработки
npm run build          # Сборка проекта
npm run start          # Запуск production
npm run test           # Запуск тестов
npm run lint           # Проверка кода
npm run type-check     # Проверка TypeScript
```

### Docker
```bash
docker-compose up -d           # Запуск всех сервисов
docker-compose down            # Остановка сервисов
docker-compose logs -f app     # Просмотр логов
docker-compose exec app npm run seed # Заполнение БД
```

---

## 🧪 Тестирование

### Backend тесты
- **Unit тесты:** Jest с покрытием 80%+
- **Integration тесты:** Supertest для API
- **E2E тесты:** Полное тестирование workflows
- **WebSocket тесты:** Тестирование real-time функций

### Frontend тесты
- **Component тесты:** React Testing Library
- **Hook тесты:** Тестирование кастомных хуков
- **Integration тесты:** Полное тестирование страниц
- **E2E тесты:** Cypress для критических путей

```bash
# Запуск всех тестов
npm run test

# Запуск с покрытием
npm run test:cov

# Запуск в watch режиме
npm run test:watch
```

---

## 📦 Deployment

### Production Docker
```bash
# Сборка production образов
docker-compose -f docker-compose.prod.yml build

# Запуск в production режиме
docker-compose -f docker-compose.prod.yml up -d

# Масштабирование
docker-compose up -d --scale app=3
```

### Environment переменные
```env
# Production
NODE_ENV=production
PORT=3001

# Monitoring
LOG_LEVEL=info
PROMETHEUS_METRICS=true

# Security
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100
```

---

## 🔍 Мониторинг и логирование

### Логирование
- **Structured logging:** Pino для производительности
- **Log levels:** Debug, Info, Warn, Error
- **Request tracking:** Correlation IDs
- **Performance metrics:** Response times

### Health checks
```bash
# Проверка состояния сервисов
curl http://localhost:3001/health

# Проверка Redis
curl http://localhost:3001/health/redis

# Проверка MongoDB
curl http://localhost:3001/health/database
```

---

## 🚨 Troubleshooting

### Общие проблемы

#### ❌ Redis connection failed
```bash
# Проверьте статус Redis
redis-cli ping

# Проверьте настройки в .env
REDIS_HOST=localhost
REDIS_PORT=6379
```

#### ❌ Frontend не подключается к WebSocket
```bash
# Проверьте CORS в main.ts
# Убедитесь что backend запущен
# Проверьте NEXT_PUBLIC_SOCKET_URL
```

#### ❌ Database connection timeout
```bash
# Проверьте MONGODB_URI
# Убедитесь в доступности MongoDB
# Проверьте Network Access в MongoDB Atlas
```

#### ❌ Email не отправляется
```bash
# Проверьте RESEND_API_KEY
# Убедитесь в корректности FROM_EMAIL
# Проверьте лимиты аккаунта Resend
```

---

## 📚 Технологический стек

### Backend
- **Framework:** NestJS 10+ с TypeScript
- **Database:** MongoDB с Mongoose ODM
- **Caching:** Redis для сессий и кэширования
- **Real-time:** Socket.IO с Redis adapter
- **Authentication:** JWT с Passport.js
- **Email:** Resend API
- **Testing:** Jest, Supertest
- **Documentation:** Swagger/OpenAPI

### Frontend
- **Framework:** Next.js 15 с App Router
- **Language:** TypeScript 5+
- **Styling:** Tailwind CSS 4+
- **UI Library:** Shadcn/ui + Radix UI
- **State Management:** Zustand + TanStack Query
- **Forms:** React Hook Form + Zod
- **Testing:** Jest + React Testing Library
- **Real-time:** Socket.IO client

### Infrastructure
- **Containerization:** Docker + Docker Compose
- **Reverse Proxy:** Nginx
- **Process Management:** PM2
- **Monitoring:** Prometheus + Grafana (optional)
- **CI/CD:** GitHub Actions ready

---

## 🔒 Безопасность

### Реализованные меры
- ✅ JWT с короткими TTL
- ✅ Rate limiting для API
- ✅ Input validation и sanitization
- ✅ CORS configuration
- ✅ Security headers (Helmet)
- ✅ Password hashing (bcrypt)
- ✅ File upload validation
- ✅ Environment variables protection

### Рекомендации для production
- 🔐 Используйте HTTPS
- 🔐 Настройте firewall
- 🔐 Регулярно обновляйте зависимости
- 🔐 Мониторьте безопасность
- 🔐 Backup базы данных

---

## 📄 Лицензия

MIT License - см. файл [LICENSE](LICENSE) для деталей.

---

## 📞 Поддержка

Если есть вопросы или предложения:
- 📧 Email: [relmontovror@gmail.com](mailto:relmontovror@gmail.com)
- 💬 Telegram: [@Relmontov](https://t.me/Relmontov)

---

**Сделано с ❤️ для эффективной корпоративной поддержки**