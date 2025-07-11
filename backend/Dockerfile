# Multi-stage build для production
FROM node:20-alpine AS builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --only=production && npm cache clean --force

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Устанавливаем необходимые системные зависимости
RUN apk add --no-cache \
    tini \
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

# Создаем директорию для uploads
RUN mkdir -p /app/uploads && chown -R nestjs:nodejs /app/uploads

# Копируем необходимые файлы
COPY --chown=nestjs:nodejs . .

# Переключаемся на непривилегированного пользователя
USER nestjs

# Экспонируем порт
EXPOSE 3000

# Проверка здоровья
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Используем tini как init процесс
ENTRYPOINT ["/sbin/tini", "--"]

# Запускаем приложение
CMD ["node", "dist/main.js"]