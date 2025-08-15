# Пошаговая инструкция развертывания на teleshop.su

## Шаг 1: Подготовка базы данных

1. Откройте браузер и перейдите на https://supabase.com/dashboard/project/kzrafexlalajoirzugdj/sql
2. Войдите в свой аккаунт Supabase
3. Скопируйте содержимое файла `database/create_tables.sql` и выполните в SQL Editor
4. Нажмите "Run" для выполнения SQL запросов

## Шаг 2: Загрузка файлов на сервер

### Вариант A: Через панель управления хостингом

1. Войдите в панель управления вашего VPS
2. Найдите файловый менеджер или FTP доступ
3. Загрузите архив `teleshop-deploy.tar.gz` в директорию `/tmp/`

### Вариант B: Через веб-терминал

1. Откройте веб-терминал в панели управления VPS
2. Выполните команды ниже

## Шаг 3: Развертывание на сервере

Подключитесь к серверу через веб-терминал или SSH клиент и выполните следующие команды:

```bash
# 1. Переход в директорию проекта
cd /tmp
mkdir -p /opt/teleshop
cd /opt/teleshop

# 2. Распаковка архива (если загрузили через панель)
tar -xzf /tmp/teleshop-deploy.tar.gz

# 3. Установка Docker (если не установлен)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl start docker
systemctl enable docker

# 4. Установка Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 5. Установка certbot для SSL
apt-get update
apt-get install -y certbot

# 6. Остановка всех сервисов на портах 80 и 443
systemctl stop nginx 2>/dev/null || true
docker stop $(docker ps -q) 2>/dev/null || true

# 7. Получение SSL сертификата
certbot certonly --standalone \
    --non-interactive \
    --agree-tos \
    --email admin@teleshop.su \
    -d teleshop.su \
    -d www.teleshop.su

# 8. Запуск приложения
docker-compose -f docker-compose.prod.yml up -d --build

# 9. Проверка статуса
docker-compose -f docker-compose.prod.yml ps
```

## Шаг 4: Проверка работы

1. **Проверка контейнеров:**
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   ```
   Все контейнеры должны быть в статусе "Up"

2. **Просмотр логов:**
   ```bash
   docker-compose -f docker-compose.prod.yml logs -f
   ```

3. **Проверка через браузер:**
   - Откройте https://teleshop.su
   - Должна отобразиться главная страница

4. **Проверка Telegram бота:**
   - Найдите вашего бота в Telegram
   - Отправьте команду `/start`
   - Бот должен ответить приветственным сообщением

## Устранение проблем

### Если контейнеры не запускаются:
```bash
# Посмотреть подробные логи
docker-compose -f docker-compose.prod.yml logs bot-backend
docker-compose -f docker-compose.prod.yml logs frontend
docker-compose -f docker-compose.prod.yml logs nginx
```

### Если SSL сертификат не работает:
```bash
# Проверить наличие сертификатов
ls -la /etc/letsencrypt/live/teleshop.su/

# Перевыпустить сертификат
certbot renew --force-renewal
```

### Если бот не отвечает:
```bash
# Проверить логи бота
docker-compose -f docker-compose.prod.yml logs bot-backend --tail=100

# Перезапустить контейнер бота
docker-compose -f docker-compose.prod.yml restart bot-backend
```

## Команды для управления

- **Остановить все контейнеры:** `docker-compose -f docker-compose.prod.yml down`
- **Запустить все контейнеры:** `docker-compose -f docker-compose.prod.yml up -d`
- **Перезапустить контейнер:** `docker-compose -f docker-compose.prod.yml restart [имя_сервиса]`
- **Обновить приложение:** Повторите шаги 2-3 с новым архивом

## Контакты для поддержки

Если возникли проблемы при развертывании, проверьте:
1. Правильность токена бота в файле .env
2. Доступность домена teleshop.su
3. Правильность данных Supabase в .env
