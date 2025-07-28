# Исправление проблемы многократного обновления статуса "прочитано"

## Проблема
Сообщения отмечались как прочитанные несколько раз, что приводило к:
- Лишним запросам к базе данных
- Избыточным WebSocket уведомлениям
- "Дерганию" индикаторов прочтения в UI
- Неэффективному использованию ресурсов

## Решение

### 1. Frontend: Виджет (`widget/src/components/ChatWidget.tsx:445-479`)
```javascript
// Добавлена дедупликация с умной проверкой
const hasUnreadMessages = useRef(false);
const lastReadTimestamp = useRef<number>(0);

// Отмечаем как прочитанные только если:
// - Есть реально непрочитанные сообщения от оператора
// - Прошло 5 секунд с последнего вызова
const shouldMarkAsRead = unreadOperatorMessages.length > 0 && 
                        (now - lastReadTimestamp.current) > 5000;
```

### 2. Backend: Service Layer (`backend/src/chat/chat.service.ts:254-335`)
```javascript
// Redis дедупликация
const deduplicationKey = `read_status:${conversationId}:${userId}`;
const client = this.redisService.getClient();

// Проверяем блокировку (5 секунд)
const existingLock = await client.get(deduplicationKey);
if (existingLock) return; // Пропускаем дубликат

// Устанавливаем блокировку
await client.setEx(deduplicationKey, 5, Date.now().toString());

// Проверяем есть ли реально непрочитанные сообщения
const unreadCount = await this.messageModel.countDocuments({
  conversationId: new Types.ObjectId(conversationId),
  senderId: { $ne: userObjectId },
  readBy: { $ne: userObjectId }
});

if (unreadCount === 0) return; // Нечего обновлять
```

### 3. Frontend: Админ-панель (`admin-panel/src/hooks/useChat.ts:594-647`)
```javascript
// Троттлинг на 3 секунды
const markAsReadThrottle = useRef<{ [key: string]: number }>({});

const markAsRead = useCallback((conversationId: string, messageId?: string) => {
  const throttleKey = messageId ? `${conversationId}:${messageId}` : conversationId;
  const now = Date.now();
  const lastCall = markAsReadThrottle.current[throttleKey] || 0;
  
  // Не разрешаем отмечать чаще чем раз в 3 секунды
  if (now - lastCall < 3000) {
    return false;
  }
  
  markAsReadThrottle.current[throttleKey] = now;
  return emit('mark-as-read', payload);
}, [emit, isConnected]);
```

## Технические детали

### Redis ключи дедупликации:
- `read_status:${conversationId}:${userId}` - для отметки всех сообщений (TTL: 5 сек)
- `read_single:${messageId}:${userId}` - для отметки одного сообщения (TTL: 10 сек)

### Временные интервалы:
- **Виджет**: 5 секунд между вызовами `markMessagesAsRead`
- **Админ-панель**: 3 секунды между WebSocket `mark-as-read` событиями
- **Backend**: 5-10 секунд Redis блокировки

### Проверки перед обновлением:
1. **Виджет**: Есть ли непрочитанные сообщения от оператора
2. **Backend**: Счетчик непрочитанных сообщений > 0
3. **Single Message**: Проверка `message.readBy` массива

## Результат
✅ **Сообщения отмечаются как прочитанные строго один раз**  
✅ **Нет лишних обновлений БД и WebSocket уведомлений**  
✅ **Стабильные индикаторы статуса прочтения**  
✅ **Эффективная работа при одновременном использовании виджета и админки**  

## Логирование
Backend теперь логирует:
- Пропущенные дубликаты (`Skipping markMessagesAsRead - too frequent`)
- Количество реально обновленных сообщений (`Successfully marked X messages as read`)
- Случаи когда нет непрочитанных сообщений (`No unread messages for user`)

Это позволяет отслеживать эффективность системы дедупликации.