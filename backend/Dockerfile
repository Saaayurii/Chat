# Multi-stage build для production
FROM node:20-alpine AS builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем все зависимости для сборки
RUN npm ci && npm cache clean --force

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Устанавливаем необходимые системные зависимости
RUN apk add --no-cache \
    tini \
    dumb-init \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nestjs -u 1001

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем только production зависимости
RUN npm ci --only=production && npm cache clean --force

# Копируем собранное приложение из builder stage
COPY --from=builder /app/dist ./dist

# Создаем директорию для uploads с правильными правами
RUN mkdir -p /opt/render/project/src/uploads && \
    chown -R nestjs:nodejs /opt/render/project/src/uploads && \
    chmod 755 /opt/render/project/src/uploads

# Копируем необходимые файлы
COPY --chown=nestjs:nodejs healthcheck.js .

# Переключаемся на непривилегированного пользователя
USER nestjs

# Экспонируем порт
EXPOSE 3000

# Проверка здоровья
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Используем dumb-init как init процесс для правильной обработки сигналов
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Запускаем приложение
CMD ["node", "dist/main.js"]