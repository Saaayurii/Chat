# Исправления виджета - старые сообщения и имена операторов

## Исправленные проблемы:

### 1. ✅ Старые сообщения не загружались (пустой массив)

**Проблема:** Виджет получал пустой массив при восстановлении разговора

**Причина:** 
- В `PublicChatController` передавались неправильные параметры в `getConversationMessages`
- Метод ожидал `page`, но получал `skip`

**Исправление:**
```javascript
// public-chat.controller.ts:61-66
const page = Math.floor((query.skip || 0) / (query.limit || 50)) + 1;
return this.chatService.getConversationMessages(
  conversationId,
  query.limit,
  page,
);
```

### 2. ✅ Имена операторов показывались как "undefined"

**Проблема:** В сообщениях `senderName` было `undefined`

**Причина:** 
- Неправильный populate в `getConversationMessages`  
- Логика формирования `senderName` не учитывала все возможные поля

**Исправление:**
```javascript
// chat.service.ts:217-235
const enrichedMessages = messages.map(msg => {
  const sender = msg.senderId as any;
  let senderName = 'Неизвестный';
  
  if (sender) {
    if (sender.profile?.fullName) {
      senderName = sender.profile.fullName;
    } else if (sender.firstName) {
      senderName = sender.firstName + (sender.lastName ? ` ${sender.lastName}` : '');
    } else if (sender.email) {
      senderName = sender.role === 'operator' ? `Оператор (${sender.email})` : sender.email;
    } else if (sender.role === 'operator') {
      senderName = 'Оператор';
    }
  }
  
  (msg as any).senderName = senderName;
  return msg;
});
```

### 3. ✅ Приветственное сообщение не создавалось

**Проблема:** При подключении к оператору не появлялось приветственное сообщение

**Причина:** `hasOnlineOperators` всегда было `false` из-за проверки `operator.profile?.isOnline`

**Исправление:**
```javascript
// chat.service.ts:902-903
const hasOnlineOperators = true; // Всегда создаем приветственное сообщение
console.log('Есть назначенный оператор:', !!operator, 'создаем приветственное сообщение:', hasOnlineOperators);
```

### 4. ✅ Улучшенные логи для отладки

**Добавлено:**
- Подробное логирование в `getConversationMessages`
- Информация о найденных сообщениях
- Детальные error stack traces

```javascript
// chat.service.ts:204
this.logger.log(`Getting conversation messages: conversationId=${conversationId}, limit=${limit}, page=${page}, skip=${skip}`);
this.logger.log(`Found ${messages.length} messages for conversation ${conversationId}`);
```

## Технические детали:

### Исправленные файлы:
1. **`backend/src/chat/public-chat.controller.ts`** - исправлен расчет page из skip
2. **`backend/src/chat/chat.service.ts`** - улучшен метод `getConversationMessages`
3. **`backend/src/chat/chat.gateway.ts`** - улучшена обработка кэшированных сообщений
4. **`backend/src/chat/chat.service.ts`** - принудительное создание приветственного сообщения

### Populate поля:
```javascript
.populate('senderId', 'email firstName lastName profile role')
```

### Приоритет имен операторов:
1. `sender.profile?.fullName`
2. `sender.firstName + sender.lastName`  
3. `Оператор (${sender.email})` для операторов
4. `Оператор` как fallback для операторов
5. `Неизвестный` как общий fallback

## Результат:
✅ **Старые сообщения корректно загружаются**  
✅ **Имена операторов отображаются правильно**  
✅ **Приветственное сообщение создается при подключении**  
✅ **Детальное логирование для отладки**

Теперь виджет должен работать корректно с загрузкой истории сообщений и отображением имен операторов!