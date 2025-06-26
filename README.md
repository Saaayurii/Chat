# 💬 Chat - Консультационная система

Полнофункциональная консультационная система с real-time чатом, системой ролей и email аутентификацией.

**Backend:** NestJS + TypeScript + MongoDB + Socket.IO  
**Frontend:** Vanilla HTML/CSS/JS с Live Server  
**Аутентификация:** JWT + Email подтверждение через Resend  

---

## 🚀 Быстрый старт

### 1. Клонирование и установка

```bash
# Клонируйте репозиторий
git clone <repository-url>
cd chat-project

# Установите зависимости backend
cd backend
npm install
```

### 2. Настройка окружения

1. **Создайте файл `.env`** в папке `backend/` на основе `.env.example`:

```bash
cp .env.example .env
```

2. **Заполните обязательные переменные** в `.env`:

```env
# 🗄️ База данных
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatdb

# 🔐 JWT секреты (сгенерируйте криптографически стойкие ключи)
JWT_SECRET=your-64-character-jwt-secret-key-here
REFRESH_TOKEN_SECRET=your-64-character-refresh-secret-key-here
COOKIE_SECRET=your-32-character-cookie-secret-here

# 📧 Email сервис (получить на resend.com)
RESEND_API_KEY=re_your_resend_api_key_here
FROM_EMAIL=noreply@yourdomain.com

# 🌐 URLs
CLIENT_URL=http://localhost:5500
SERVER_PORT=3000
```

### 3. Генерация секретных ключей

```bash
# Генерация JWT_SECRET (64 символа)
openssl rand -hex 32

# Генерация REFRESH_TOKEN_SECRET (64 символа) 
openssl rand -hex 32

# Генерация COOKIE_SECRET (32 символа)
openssl rand -hex 16
```

### 4. Настройка внешних сервисов

#### 📧 **Resend (Email сервис)**
1. Зарегистрируйтесь на [resend.com](https://resend.com)
2. Создайте API ключ в Dashboard → API Keys
3. Добавьте ключ в `RESEND_API_KEY`
4. Для тестов можете использовать `FROM_EMAIL=onboarding@resend.dev`

#### 🗄️ **MongoDB Atlas**
1. Создайте кластер на [mongodb.com](https://cloud.mongodb.com)
2. Настройте Network Access (добавьте IP или 0.0.0.0/0 для разработки)
3. Создайте пользователя БД
4. Получите connection string и добавьте в `MONGODB_URI`

### 5. Запуск backend

```bash
cd backend

# Режим разработки (с автоперезапуском)
npm run start:dev

# Обычный запуск
npm start

# Проверка запуска
curl http://localhost:3000/api-docs
```

**Backend запустится на:** `http://localhost:3000`  
**API документация:** `http://localhost:3000/api-docs`

### 6. Запуск frontend

```bash
cd frontend

# Если используете VS Code с Live Server:
# 1. Кликните правой кнопкой на index.html
# 2. Выберите "Open with Live Server"

```

**Frontend откроется на:** `http://localhost:5500` (или другой порт Live Server)

---

## 📁 Структура проекта

```
chat-project/
├── backend/                 # NestJS сервер
│   ├── src/
│   │   ├── auth/           # Модуль аутентификации
│   │   │   ├── dto/        # DTO для auth операций
│   │   │   ├── strategies/ # Passport стратегии (JWT, Local)
│   │   │   └── interfaces/ # Интерфейсы auth ответов
│   │   ├── users/          # Модуль пользователей
│   │   │   ├── dto/        # DTO для CRUD пользователей
│   │   │   └── interfaces/ # Интерфейсы пользователей
│   │   ├── chat/           # Модуль real-time чата
│   │   │   ├── dto/        # DTO для чат операций
│   │   │   └── events/     # WebSocket события
│   │   ├── database/       # MongoDB схемы
│   │   │   └── schemas/    # Mongoose схемы
│   │   ├── common/         # Общие компоненты
│   │   │   ├── decorators/ # Кастомные декораторы
│   │   │   ├── guards/     # Защитники маршрутов
│   │   │   ├── pipes/      # Пайпы валидации
│   │   │   └── interfaces/ # Общие интерфейсы
│   │   └── main.ts         # Точка входа
│   ├── .env.example        # Шаблон переменных окружения
│   └── package.json
├── frontend/               # HTML/CSS/JS фронтенд
│   ├── index.html          # Главная страница
│   ├── login.html          # Страница входа
│   ├── register.html       # Страница регистрации
│   ├── chat.html           # Интерфейс чата
│   ├── styles/             # CSS стили
│   │   ├── main.css
│   │   ├── auth.css
│   │   └── chat.css
│   └── scripts/            # JavaScript логика
│       ├── main.js
│       ├── auth.js
│       └── chat.js
└── README.md
```

---

## 🎯 Функционал системы

### 👥 **Система ролей**
- **Администратор:** Полный доступ, управление операторами, жалобы
- **Оператор:** Ответы на вопросы, чат с пользователями и другими операторами  
- **Посетитель:** Задавать вопросы, чат с операторами, оценки

### 🔐 **Аутентификация**
- ✅ Регистрация с email подтверждением
- ✅ Вход/выход с JWT токенами
- ✅ Сброс пароля через email
- ✅ Refresh токены в безопасных cookies
- ✅ Роль-основанная авторизация

### 💬 **Real-time чат**
- ✅ WebSocket соединения через Socket.IO
- ✅ Мгновенная доставка сообщений
- ✅ Индикаторы "печатает..."
- ✅ Онлайн/оффлайн статусы
- ✅ История сообщений

### ❓ **Система вопросов**
- ✅ Создание и управление вопросами
- ✅ Автоматическое распределение операторам
- ✅ Передача между операторами
- ✅ Статусы и приоритеты

### ⭐ **Дополнительно**
- ✅ Рейтинги операторов
- ✅ Система жалоб
- ✅ Черный список пользователей
- ✅ Загрузка аватаров
- ✅ Swagger API документация

---

## 🔧 API Endpoints

### 🔐 **Аутентификация** (`/auth`)
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

### 👥 **Пользователи** (`/users`)
```
GET    /users               # Список пользователей
POST   /users               # Создать пользователя (admin)
POST   /users/operators     # Создать оператора (admin)
GET    /users/:id           # Пользователь по ID
PUT    /users/:id           # Обновить пользователя
DELETE /users/:id           # Удалить пользователя
```

### 👤 **Профиль** (`/profile`)
```
GET /profile                # Свой профиль
PUT /profile                # Обновить профиль
PUT /profile/avatar         # Загрузить аватар
GET /profile/statistics     # Статистика профиля
```

### 💬 **Чат** (`/chat`)
```
WebSocket: ws://localhost:3000/chat
События: join-room, send-message, typing-start, typing-stop
```

---

## 🛠 Команды разработки

```bash
# Backend команды
cd backend
npm run start:dev      # Режим разработки
npm run build          # Сборка проекта
npm run test           # Запуск тестов
npm run lint           # Проверка кода

# Генерация NestJS компонентов
npm run nest g module <name>     # Создать модуль
npm run nest g service <name>    # Создать сервис
npm run nest g controller <name> # Создать контроллер
```

---

## 🐛 Troubleshooting

### ❌ **Backend не запускается**
```bash
# Проверьте переменные окружения
cat backend/.env

# Проверьте подключение к MongoDB
mongo "your-mongodb-connection-string"

# Проверьте логи запуска
npm run start:dev
```

### ❌ **Frontend не может подключиться к API**
1. Убедитесь что backend запущен на порту 3000
2. Проверьте CORS настройки в `main.ts`
3. Проверьте `CLIENT_URL` в `.env`

### ❌ **Email не отправляется**
1. Проверьте `RESEND_API_KEY` в `.env`
2. Убедитесь что `FROM_EMAIL` корректный
3. Проверьте лимиты Resend аккаунта

### ❌ **JWT ошибки**
1. Убедитесь что `JWT_SECRET` установлен и достаточно длинный
2. Проверьте время жизни токенов `JWT_EXPIRES_IN`
3. Очистите cookies и localStorage в браузере

---

## 📚 Дополнительные ресурсы

- **NestJS документация:** [docs.nestjs.com](https://docs.nestjs.com)
- **MongoDB Atlas:** [cloud.mongodb.com](https://cloud.mongodb.com)
- **Resend Email API:** [resend.com/docs](https://resend.com/docs)
- **Socket.IO документация:** [socket.io/docs](https://socket.io/docs)

---

## 🤝 Контрибьюция

1. Форкните репозиторий
2. Создайте feature ветку: `git checkout -b feature/amazing-feature`
3. Закоммитьте изменения: `git commit -m 'Add amazing feature'`
4. Запушьте в ветку: `git push origin feature/amazing-feature`
5. Откройте Pull Request

---

## 📄 Лицензия

Этот проект лицензирован под MIT License - см. файл [LICENSE](LICENSE) для деталей.

---

## 📞 Контакты

Если есть вопросы или предложения:
- 📧 Email: [relmontovror@gmail.com](relmontovror@gmail.com)
- 💬 Telegram: [@Relmontov](https://t.me/your-username)

---

**Сделано с ❤️ для эффективной консультационной поддержки**