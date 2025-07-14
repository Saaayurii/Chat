# Redis Implementation для Chat системы

## Обзор

Реализована полноценная система кэширования и уведомлений на основе Redis для чат-приложения, включающая:

- ✅ Кэширование сообщений чата
- ✅ Система rate limiting для API и сообщений
- ✅ Redis pub/sub для уведомлений в реальном времени
- ✅ Кэширование пользовательских данных и сессий
- ✅ Система очередей для обработки сообщений
- ✅ Аналитика и метрики чата
- ✅ Временное хранение файлов и медиа

## Архитектура

### Основные компоненты

1. **RedisService** - Базовый сервис для работы с Redis
2. **MessageCacheService** - Кэширование сообщений чата
3. **RateLimitService** - Система ограничений запросов
4. **NotificationService** - Pub/Sub уведомления
5. **RateLimitGuard** - Guard для защиты эндпоинтов

## 1. Кэширование сообщений чата

### Использование

```typescript
// В ChatService
const result = await this.messageCacheService.getMessages(
  conversationId,
  limit,
  skip,
  async (convId, lmt, skp) => {
    // Fallback функция для получения из БД
    return await this.messageModel.find({...}).exec();
  }
);

// Добавление нового сообщения в кэш
await this.messageCacheService.addMessage(savedMessage);
```

### Особенности

- Автоматический fallback на базу данных
- TTL 7 дней для кэшированных сообщений
- Лимит 100 сообщений на беседу в кэше
- Поддержка обновления и удаления сообщений

## 2. Rate Limiting

### Использование декораторов

```typescript
import { MessageRateLimit, ApiRateLimit, AuthRateLimit } from '../common/decorators/rate-limit.decorator';

// Лимит на отправку сообщений
@Post('send')
@MessageRateLimit(30, 60) // 30 сообщений в минуту
@UseGuards(AuthGuard, RateLimitGuard)
async sendMessage() {}

// Лимит на API запросы
@Get('conversations')
@ApiRateLimit(100, 900) // 100 запросов в 15 минут
@UseGuards(AuthGuard, RateLimitGuard)
async getConversations() {}

// Лимит на авторизацию
@Post('login')
@AuthRateLimit('login', 5) // 5 попыток входа
@UseGuards(RateLimitGuard)
async login() {}
```

### Предустановленные лимиты

- **API**: 100 запросов / 15 минут
- **Сообщения**: 30 сообщений / минуту
- **Логин**: 5 попыток / 15 минут
- **Регистрация**: 3 попытки / час
- **Загрузка файлов**: 10 файлов / 5 минут

### Автоматические баны

- 3 нарушения → бан на 15 минут
- 5 нарушений → бан на 1 час
- 10 нарушений → бан на 24 часа

## 3. Pub/Sub уведомления

### Типы уведомлений

```typescript
// Новое сообщение
await this.notificationService.publishMessageNotification(
  conversationId,
  message,
  recipientIds
);

// Статус набора текста
await this.notificationService.publishTypingNotification(
  conversationId,
  userId,
  isTyping
);

// Изменение статуса присутствия
await this.notificationService.publishPresenceNotification(
  userId,
  status,
  additionalData
);

// Системные уведомления
await this.notificationService.publishSystemNotification(
  'maintenance',
  { message: 'Система будет недоступна' },
  targetUserIds,
  'high'
);
```

### Подписка на уведомления

```typescript
// В WebSocket Gateway
await this.notificationService.subscribe(
  `user.${userId}.notifications`,
  (notification) => {
    this.server.to(userId).emit('notification', notification);
  }
);
```

## 4. Кэширование пользователей и сессий

### Кэширование пользователей

```typescript
// Сохранение пользователя в кэш
await this.redisService.cacheUser(userId, userData, 3600);

// Получение из кэша
const cachedUser = await this.redisService.getCachedUser(userId);
```

### Управление сессиями

```typescript
// Сохранение сессии
await this.redisService.cacheUserSession(sessionId, sessionData, 7200);

// Получение сессии
const session = await this.redisService.getCachedSession(sessionId);

// Удаление сессии
await this.redisService.deleteCachedSession(sessionId);
```

## 5. Система очередей

### Добавление задач в очередь

```typescript
// Добавление сообщения в очередь обработки
await this.redisService.enqueueTask('message_processing', {
  type: 'moderate_content',
  messageId: message._id,
  content: message.text
}, 5); // приоритет

// Обработка очереди
const task = await this.redisService.dequeueTask('message_processing');
if (task) {
  await this.processTask(task);
}
```

### Механизм повторных попыток

- Автоматические повторы при ошибках
- Снижение приоритета при повторах
- Перемещение в очередь failed после 3 попыток

## 6. Аналитика и метрики

### Сбор метрик

```typescript
// Увеличение счетчика
await this.redisService.incrementMetric('messages_sent');
await this.redisService.incrementMetric('user_activity', 5);

// Получение метрик
const todayMessages = await this.redisService.getMetric('messages_sent');
const weeklyStats = await this.redisService.getMetricsRange(
  'messages_sent',
  '2025-01-01',
  '2025-01-07'
);
```

### Активность пользователей

```typescript
// Запись активности
await this.redisService.recordUserActivity(userId, 'message_sent', {
  conversationId,
  messageType: 'text'
});

// Получение истории активности
const activity = await this.redisService.getUserActivity(userId, 50);
```

## 7. Временное хранение файлов

### Сохранение временных файлов

```typescript
// Сохранение файла
await this.redisService.storeTempFile(
  fileId,
  fileBuffer,
  { originalName: 'document.pdf', mimeType: 'application/pdf' },
  3600 // TTL 1 час
);

// Получение файла
const file = await this.redisService.getTempFile(fileId);
if (file) {
  // file.data - Buffer с данными
  // file.metadata - метаданные
}
```

## Конфигурация

### Переменные окружения

```env
# Redis подключение
REDIS_URL=redis://username:password@host:port/db
# или локальные настройки
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=password
REDIS_DB=0

# Кэширование
CACHE_TTL=3600
CACHE_MAX=100
```

### Настройка в main.ts

```typescript
// Глобальное использование RateLimitGuard
app.useGlobalGuards(new RateLimitGuard());
```

## Мониторинг и здоровье системы

### Проверка состояния Redis

```typescript
const isHealthy = await this.redisService.healthCheck();
```

### Статистика использования

```typescript
const stats = await this.notificationService.getSubscriptionStats();
// {
//   channels: 15,
//   totalSubscribers: 45,
//   channelDetails: [...]
// }
```

### Очистка устаревших данных

```typescript
// Автоматическая очистка
const cleaned = await this.chatService.cleanupOldChatData();
// {
//   clearedMessages: 0,
//   clearedTypingStatus: 5,
//   clearedTempFiles: 12
// }
```

## Производительность

### Оптимизации

1. **Pipelining** - множественные операции в одной транзакции
2. **TTL** - автоматическое удаление устаревших данных
3. **Сжатие** - JSON сериализация для сложных объектов
4. **Индексы** - использование sorted sets для быстрых запросов

### Рекомендации по масштабированию

1. Используйте Redis Cluster для больших нагрузок
2. Настройте мониторинг памяти Redis
3. Регулярно очищайте устаревшие данные
4. Рассмотрите Redis Sentinel для высокой доступности

## Безопасность

### Rate Limiting защищает от:

- DDoS атак
- Спам сообщений
- Брутфорс авторизации
- Злоупотребления API

### Автоматические баны предотвращают:

- Массовую рассылку спама
- Систематические атаки
- Нарушение правил использования

## Примеры использования в контроллерах

```typescript
@Controller('chat')
@UseGuards(AuthGuard, RateLimitGuard)
export class ChatController {
  
  @Post('send')
  @MessageRateLimit(30, 60)
  async sendMessage(@Body() dto: SendMessageDto, @CurrentUser() user) {
    return await this.chatService.createMessage({ ...dto, senderId: user.id });
  }

  @Post('typing')
  @RateLimit({ limit: 60, window: 60, action: 'typing' })
  async setTyping(@Body() dto: TypingDto, @CurrentUser() user) {
    return await this.chatService.setTypingStatus(dto.conversationId, user.id, dto.isTyping);
  }

  @Get('metrics')
  @ApiRateLimit(10, 300) // 10 запросов в 5 минут для метрик
  @Roles('admin')
  async getMetrics(@Query() query) {
    return await this.chatService.getChatMetrics(query.startDate, query.endDate);
  }
}
```

Все компоненты интегрированы и готовы к использованию в продакшн среде.