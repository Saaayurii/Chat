
````md
# Chat

Проект с backend на NestJS и frontend на простом `index.html` с запуском через Live Server.

---

## 🚀 Быстрый старт

### 1. Запуск backend (NestJS)

1. Перейди в папку с сервером:

```bash
cd backend
````

2. Установи зависимости:

```bash
npm install
```

3. Создай файл `.env` в корне backend на основе шаблона `.env.example` и заполни переменные:

```
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/<dbname>?retryWrites=true&w=majority
```

> 🔐 **Важно:** используется **MongoDB Atlas** — облачный управляемый сервис MongoDB.
> Убедись, что у тебя есть кластер в Atlas и в `MONGO_URI` прописаны правильные данные для подключения.

4. Запусти сервер:

```bash
npm run start
```

По умолчанию сервер запустится на `http://localhost:3000`

---

### 2. Запуск frontend (статический html)

1. Перейди в папку с фронтендом:

```bash
cd frontend
```

2. Запусти Live Server (через VS Code расширение или любой другой):

* Если используешь VS Code:

  * Кликни правой кнопкой на `index.html` → "Open with Live Server"
  * Откроется браузер по адресу, например, `http://127.0.0.1:5500/index.html`

* Если нет Live Server, установи его из [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)

---

## 📝 Структура проекта

```
/src       — NestJS backend
/frontend      — frontend с index.html
```

---

## 🛠 Технологии

* NestJS + TypeScript
* MongoDB Atlas + Mongoose
* JWT аутентификация
* Простые HTML страницы с Live Server

---

## ❗ Важно

* Убедись, что backend запущен до открытия frontend — для успешных API вызовов.
* Live Server автоматически обновляет страницу при изменениях.

---

## 🐛 Ошибки и отладка

* Если сервер не запускается, проверь правильность `.env` и доступность кластера MongoDB Atlas
* Если фронтенд не может достучаться до API — проверь CORS настройки backend

---

## Контакты

Если есть вопросы — пиши \[[email@example.com](mailto:email@example.com)]

---

````

---

# .env.example

```env
# URL подключения к MongoDB Atlas
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/<dbname>?retryWrites=true&w=majority

````
