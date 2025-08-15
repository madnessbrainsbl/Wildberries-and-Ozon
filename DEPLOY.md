# Деплой на сервер teleshop.su

## Требования

- Сервер Ubuntu 24.04 с доступом по SSH
- Docker и Docker Compose
- Домен teleshop.su с A-записью на IP сервера

## Быстрый деплой

### Windows (с WSL или Git Bash)
```bash
# 1. Настройте переменные окружения
cp .env.production .env
# Отредактируйте .env файл с вашими настройками

# 2. Запустите деплой
./deploy-quick.bat
```

### Linux/macOS
```bash
# 1. Настройте переменные окружения  
cp .env.production .env
# Отредактируйте .env файл с вашими настройками

# 2. Запустите деплой
bash deploy.sh
```

## Ручной деплой

### 1. Загрузка файлов на сервер
```bash
# Скопировать проект на сервер
rsync -avz --exclude='node_modules' --exclude='.git' \
  ./ root@teleshop.su:/opt/teleshop/

# Скопировать конфигурацию
scp .env.production root@teleshop.su:/opt/teleshop/.env
```

### 2. Установка на сервере
```bash
# Подключиться к серверу
ssh root@teleshop.su

# Перейти в директорию проекта
cd /opt/teleshop

# Установить Docker (если не установлен)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl start docker
systemctl enable docker

# Установить Docker Compose (если не установлен)
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Запустить приложение
docker-compose -f docker-compose.prod.yml up --build -d

# Проверить статус
docker-compose -f docker-compose.prod.yml ps
```

### 3. Настройка SSL сертификата
```bash
# Получить SSL сертификат
docker-compose -f docker-compose.prod.yml run --rm certbot

# Перезапустить Nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

## Настройка переменных окружения

Отредактируйте файл `.env` на сервере:

```env
# Telegram Bot Token (получите у @BotFather)
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Supabase настройки (из вашего проекта Supabase)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Email для SSL сертификата
LETSENCRYPT_EMAIL=your-email@domain.com

# Безопасный пароль для PostgreSQL
POSTGRES_PASSWORD=your_secure_password_here
```

## Управление сервисами

```bash
# Посмотреть логи
docker-compose -f docker-compose.prod.yml logs -f

# Перезапустить сервис
docker-compose -f docker-compose.prod.yml restart bot-backend

# Остановить все сервисы
docker-compose -f docker-compose.prod.yml down

# Обновить и перезапустить
docker-compose -f docker-compose.prod.yml up --build -d
```

## Мониторинг

### Проверка статуса
```bash
# Статус контейнеров
docker-compose -f docker-compose.prod.yml ps

# Использование ресурсов
docker stats

# Проверка здоровья приложения
curl https://teleshop.su/health
```

### Логи
```bash
# Логи всех сервисов
docker-compose -f docker-compose.prod.yml logs -f

# Логи конкретного сервиса
docker-compose -f docker-compose.prod.yml logs -f bot-backend

# Логи Nginx
docker-compose -f docker-compose.prod.yml exec nginx tail -f /var/log/nginx/access.log
```

## Резервное копирование

```bash
# Создать бэкап базы данных
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres marketplace > backup.sql

# Создать бэкап всех данных
docker-compose -f docker-compose.prod.yml exec postgres pg_dumpall -U postgres > full_backup.sql
```

## Устранение неполадок

### Браузер не запускается
```bash
# Проверить наличие Chrome
docker-compose -f docker-compose.prod.yml exec bot-backend which chromium-browser

# Проверить права доступа
docker-compose -f docker-compose.prod.yml exec bot-backend ls -la /usr/bin/chromium-browser

# Перезапустить с правами администратора
docker-compose -f docker-compose.prod.yml restart bot-backend
```

### SSL сертификат не работает
```bash
# Проверить сертификат
docker-compose -f docker-compose.prod.yml exec nginx ls -la /etc/nginx/ssl/live/teleshop.su/

# Обновить сертификат
docker-compose -f docker-compose.prod.yml run --rm certbot renew

# Перезапустить Nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

## Контакты

При возникновении проблем проверьте логи и статус сервисов. Убедитесь, что:

1. ✅ Домен teleshop.su указывает на IP сервера
2. ✅ Порты 80, 443, 3002 открыты на сервере
3. ✅ Переменные окружения настроены правильно
4. ✅ SSL сертификаты получены и установлены
5. ✅ Docker контейнеры запущены и работают
