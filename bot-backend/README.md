# Telegram Bot Backend

## Описание

Бэкенд для Telegram-бота, который автоматизирует процесс оформления заказов на маркетплейсах Wildberries и Ozon.

## Функциональность

- 🛍 Интеграция с Telegram Mini App для выбора товаров
- 🔐 Авторизация на маркетплейсах через Selenium/Puppeteer
- 🛒 Автоматическое добавление товаров в корзину
- 📦 Оформление заказов
- 📊 Отслеживание статуса заказов
- 💾 Сохранение истории заказов в базе данных

## Установка

1. Установите зависимости:
```bash
npm install
```

2. Создайте файл `.env` и настройте переменные окружения:
```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Server
PORT=3001

# MiniApp URL
MINIAPP_URL=http://localhost:5173

# Browser settings
HEADLESS_BROWSER=false
```

3. Создайте таблицы в Supabase, используя `schema.sql`

4. Создайте бота в Telegram через @BotFather и получите токен

## Запуск

### Режим разработки
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## Использование бота

1. Запустите бота командой `/start`
2. Откройте магазин через кнопку "Open Store"
3. Выберите товары в Mini App
4. Нажмите "Оформить заказ"
5. Выберите маркетплейс (Wildberries или Ozon)
6. Если аккаунт не привязан:
   - Используйте "Link Accounts"
   - Введите номер телефона/email
   - Введите код подтверждения
7. Бот автоматически оформит заказ

## Структура проекта

```
bot-backend/
├── src/
│   ├── controllers/
│   │   └── BotController.ts    # Обработчики команд бота
│   ├── services/
│   │   ├── BrowserService.ts   # Автоматизация браузера
│   │   └── OrderService.ts     # Управление заказами
│   ├── types/
│   │   └── index.ts           # TypeScript типы
│   ├── utils/
│   │   └── supabase.ts        # Клиент Supabase
│   └── index.ts               # Точка входа
├── schema.sql                 # SQL схема базы данных
├── package.json
└── tsconfig.json
```

## API маркетплейсов

Для полноценной работы трекинга заказов необходимо подключить официальные API:
- Wildberries API
- Ozon Seller API

## Безопасность

- Никогда не храните пароли пользователей
- Используйте переменные окружения для чувствительных данных
- Регулярно обновляйте зависимости
- Используйте HTTPS для Mini App в production
