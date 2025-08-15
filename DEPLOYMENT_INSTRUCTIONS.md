# Развертывание проекта на сервере teleshop.su

## Подготовка сервера

### 1. Подключение к серверу
```bash
ssh root@teleshop.su
```

### 2. Установка Docker и Docker Compose
```bash
# Обновление системы
apt update

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl start docker
systemctl enable docker

# Установка Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

# Установка Nginx
apt install -y nginx

# Создание директории для проекта
mkdir -p /var/www/teleshop
```

### 3. Настройка Nginx
```bash
cat > /etc/nginx/sites-available/teleshop.su << 'EOF'
server {
    listen 80;
    server_name teleshop.su www.teleshop.su;

    # Frontend (главный сайт)
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API бота
    location /api/ {
        proxy_pass http://localhost:3002/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket поддержка для бота
    location /socket.io/ {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Активация сайта
ln -sf /etc/nginx/sites-available/teleshop.su /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Проверка и перезагрузка Nginx
nginx -t && systemctl reload nginx
systemctl enable nginx
```

## Развертывание приложения

### 1. Копирование файлов на сервер
С локального компьютера выполните:
```bash
# Из директории D:\project
scp -r * root@teleshop.su:/var/www/teleshop/
```

### 2. Создание файла окружения
На сервере создайте файл .env:
```bash
cd /var/www/teleshop
cat > .env << 'EOF'
VITE_SUPABASE_URL=https://kzrafexlalajoirzugdj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6cmFmZXhsYWxham9pcnp1Z2RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Mjk0MDMsImV4cCI6MjA2OTMwNTQwM30.rrKmafrLhQWNk7bIC5kfoO5pcvEkzO2i_THc5_Ep3nk
TELEGRAM_BOT_TOKEN=8473502537:AAG1NAD5ryNZlx-FnEGGX9jlwqli7Zpq9Y0
EOF
```

### 3. Запуск приложения
```bash
cd /var/www/teleshop

# Установка переменных окружения
export VITE_SUPABASE_URL=https://kzrafexlalajoirzugdj.supabase.co
export VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6cmFmZXhsYWxham9pcnp1Z2RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Mjk0MDMsImV4cCI6MjA2OTMwNTQwM30.rrKmafrLhQWNk7bIC5kfoO5pcvEkzO2i_THc5_Ep3nk
export TELEGRAM_BOT_TOKEN=8473502537:AAG1NAD5ryNZlx-FnEGGX9jlwqli7Zpq9Y0

# Остановка существующих контейнеров (если есть)
docker-compose -f docker-compose.prod.yml down --remove-orphans || true

# Сборка и запуск приложения
docker-compose -f docker-compose.prod.yml up -d --build
```

### 4. Проверка статуса
```bash
# Проверка статуса контейнеров
docker-compose -f docker-compose.prod.yml ps

# Просмотр логов
docker-compose -f docker-compose.prod.yml logs --tail=50

# Проверка статуса Nginx
systemctl status nginx
```

### 5. Настройка SSL (опционально)
```bash
# Установка Certbot
apt install -y certbot python3-certbot-nginx

# Получение SSL сертификата
certbot --nginx -d teleshop.su -d www.teleshop.su --non-interactive --agree-tos --email admin@teleshop.su --redirect
```

## Проверка работы

После развертывания:
1. Откройте https://teleshop.su - должен открыться фронтенд
2. Проверьте https://teleshop.su/api - должен отвечать бэкенд бота
3. Отправьте /start боту в Telegram - должен отвечать

## Отладка

### Просмотр логов контейнеров:
```bash
cd /var/www/teleshop
docker-compose -f docker-compose.prod.yml logs frontend
docker-compose -f docker-compose.prod.yml logs bot-backend
```

### Перезапуск сервисов:
```bash
cd /var/www/teleshop
docker-compose -f docker-compose.prod.yml restart
```

### Полная пересборка:
```bash
cd /var/www/teleshop
docker-compose -f docker-compose.prod.yml down
docker system prune -f
docker-compose -f docker-compose.prod.yml up -d --build
```

## Устранение проблем с Wildberries

Если у вас возникают проблемы с входом в Wildberries, проверьте:

1. **Логи бота**: `docker-compose -f docker-compose.prod.yml logs bot-backend`
2. **Скриншоты ошибок**: В папке `/tmp/` на сервере
3. **Браузер работает**: Chromium установлен в контейнере
4. **Правильный формат номера**: +7XXXXXXXXXX

Для временного решения проблемы с входом можно использовать тестовый режим в коде бота.
