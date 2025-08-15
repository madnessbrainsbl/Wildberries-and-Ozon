/*
  # Telegram Bot Edge Function
  
  Обрабатывает webhook запросы от Telegram Bot API и управляет взаимодействием с пользователями магазинов.
*/

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

interface TelegramUpdate {
  update_id: number
  message?: {
    message_id: number
    from: {
      id: number
      first_name: string
      last_name?: string
      username?: string
    }
    chat: {
      id: number
      type: string
    }
    text?: string
    web_app_data?: {
      data: string
      button_text: string
    }
  }
  callback_query?: {
    id: string
    from: {
      id: number
      first_name: string
      last_name?: string
      username?: string
    }
    data: string
    message: any
  }
}

// Глобальная переменная для хранения текущего токена бота
let currentBotToken: string | null = null

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    // Validate webhook secret
    const url = new URL(req.url)
    const secret = url.searchParams.get('secret')
    const expectedSecret = Deno.env.get('TELEGRAM_WEBHOOK_SECRET')
    
    console.log('Webhook request received:', {
      method: req.method,
      url: req.url,
      secret: secret,
      expectedSecret: expectedSecret,
      headers: Object.fromEntries(req.headers.entries())
    })

    if (!secret || secret !== expectedSecret) {
      console.error('Webhook authentication failed:', { secret, expectedSecret })
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid secret' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    console.log('Webhook authentication successful')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const update: TelegramUpdate = await req.json()
    console.log('Received Telegram update:', JSON.stringify(update, null, 2))
    
    // Определяем токен бота из заголовков или другим способом
    // Пока используем простой подход - ищем магазин с webhook URL
    await determineBotToken(supabase)
    
    // Обработка обычных сообщений
    if (update.message) {
      console.log('Processing message:', update.message)
      await handleMessage(supabase, update.message)
    }
    
    // Обработка callback запросов (inline кнопки)
    if (update.callback_query) {
      console.log('Processing callback query:', update.callback_query)
      await handleCallbackQuery(supabase, update.callback_query)
    }

    console.log('Webhook processing completed successfully')
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error processing update:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function determineBotToken(supabase: any) {
  try {
    // Находим первый активный магазин с токеном бота
    const { data: stores } = await supabase
      .from('stores')
      .select('telegram_bot_token')
      .not('telegram_bot_token', 'is', null)
      .eq('status', 'active')
      .limit(1)
    
    if (stores && stores.length > 0) {
      currentBotToken = stores[0].telegram_bot_token
      console.log('Determined bot token for current request')
    }
  } catch (error) {
    console.error('Error determining bot token:', error)
  }
}

async function handleMessage(supabase: any, message: any) {
  const { from, text, chat } = message
  console.log('Handling message:', { from, text, chat })
  
  // Регистрируем или обновляем клиента
  await upsertCustomer(supabase, from)
  
  if (text?.startsWith('/start')) {
    console.log('Processing /start command')
    await sendWelcomeMessage(from.id, extractStoreId(text))
  } else if (text === '/catalog' || text === 'Каталог 📦') {
    console.log('Processing catalog command')
    await sendCatalog(from.id)
  } else if (text === '/orders' || text === 'Мои заказы 📋') {
    console.log('Processing orders command')
    await sendOrders(supabase, from.id)
  } else if (text === '/help' || text === 'Помощь ❓') {
    console.log('Processing help command')
    await sendHelp(from.id)
  } else {
    console.log('Processing default message')
    await sendMainMenu(from.id)
  }
}

async function handleCallbackQuery(supabase: any, callbackQuery: any) {
  const { from, data } = callbackQuery
  console.log('Handling callback query:', { from, data })
  
  if (data.startsWith('product_')) {
    const productId = data.replace('product_', '')
    await showProduct(supabase, from.id, productId)
  } else if (data.startsWith('add_to_cart_')) {
    const productId = data.replace('add_to_cart_', '')
    await addToCart(supabase, from.id, productId)
  } else if (data === 'view_cart') {
    await showCart(supabase, from.id)
  } else if (data === 'checkout') {
    await startCheckout(supabase, from.id)
  }
}

async function upsertCustomer(supabase: any, user: any) {
  console.log('Upserting customer:', user)
  const { error } = await supabase
    .from('customers')
    .upsert({
      telegram_id: user.id.toString(),
      telegram_username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
    }, {
      onConflict: 'telegram_id'
    })
  
  if (error) {
    console.error('Error upserting customer:', error)
  } else {
    console.log('Customer upserted successfully')
  }
}

async function sendWelcomeMessage(chatId: number, storeId?: string) {
  console.log('Sending welcome message to:', chatId, 'storeId:', storeId)
  const message = `
🛍️ Добро пожаловать в наш магазин!

Я помогу вам найти и заказать товары. Используйте кнопки меню ниже для навигации.

Что вы хотите сделать?
  `
  
  await sendTelegramMessage(chatId, message, {
    reply_markup: {
      keyboard: [
        [{ text: 'Каталог 📦' }, { text: 'Мои заказы 📋' }],
        [{ text: 'Корзина 🛒' }, { text: 'Помощь ❓' }]
      ],
      resize_keyboard: true,
      persistent: true
    }
  })
}

async function sendCatalog(chatId: number) {
  console.log('Sending catalog to:', chatId)
  
  // Получаем информацию о магазине по токену текущего бота
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  
  let storeId = 'default'
  let storeName = 'наш магазин'
  let hasWB = false
  let hasOzon = false
  
  if (currentBotToken) {
    console.log('Finding store by bot token')
    const { data: stores } = await supabase
      .from('stores')
      .select('id, name, wildberries_token, ozon_client_id')
      .eq('telegram_bot_token', currentBotToken)
      .eq('status', 'active')
      .limit(1)
    
    if (stores && stores.length > 0) {
      storeId = stores[0].id
      storeName = stores[0].name
      hasWB = !!stores[0].wildberries_token
      hasOzon = !!stores[0].ozon_client_id
      console.log(`Found store: ${storeName} (${storeId})`)
    } else {
      console.log('No store found for current bot token')
    }
  } else {
    console.log('No current bot token available')
    // Fallback: используем первый доступный магазин
    const { data: stores } = await supabase
      .from('stores')
      .select('id, name, wildberries_token, ozon_client_id')
      .not('telegram_bot_token', 'is', null)
      .eq('status', 'active')
      .limit(1)
    
    if (stores && stores.length > 0) {
      storeId = stores[0].id
      storeName = stores[0].name
      hasWB = !!stores[0].wildberries_token
      hasOzon = !!stores[0].ozon_client_id
    }
  }
  
  // Создаем кнопки в зависимости от доступных маркетплейсов
  const buttons = []
  
  if (hasWB && hasOzon) {
    // Если есть оба маркетплейса, показываем выбор
    buttons.push([
      { 
        text: '🟣 Wildberries', 
        web_app: { url: `https://teleshop.su/miniapp/${storeId}?marketplace=wildberries` }
      },
      { 
        text: '🔵 Ozon', 
        web_app: { url: `https://teleshop.su/miniapp/${storeId}?marketplace=ozon` }
      }
    ])
    buttons.push([
      { 
        text: '🛍️ Все товары', 
        web_app: { url: `https://teleshop.su/miniapp/${storeId}` }
      }
    ])
  } else if (hasWB) {
    buttons.push([
      { 
        text: '🛍️ Открыть каталог Wildberries', 
        web_app: { url: `https://teleshop.su/miniapp/${storeId}?marketplace=wildberries` }
      }
    ])
  } else if (hasOzon) {
    buttons.push([
      { 
        text: '🛍️ Открыть каталог Ozon', 
        web_app: { url: `https://teleshop.su/miniapp/${storeId}?marketplace=ozon` }
      }
    ])
  } else {
    buttons.push([
      { 
        text: '🛍️ Открыть каталог', 
        web_app: { url: `https://teleshop.su/miniapp/${storeId}` }
      }
    ])
  }
  
  const message = `
📦 Каталог товаров - ${storeName}

${hasWB && hasOzon ? 'Выберите маркетплейс или просмотрите все товары:' : 'Откройте каталог товаров в удобном мини-приложении:'}

🛍️ Просматривайте товары
🛒 Добавляйте в корзину  
💳 Оформляйте заказы
  `
  
  await sendTelegramMessage(chatId, message, {
    reply_markup: {
      inline_keyboard: buttons
    }
  })
}

async function sendOrders(supabase: any, chatId: number) {
  console.log('Sending orders to:', chatId)
  try {
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('telegram_id', chatId.toString())
      .single()
    
    if (!customer) {
      await sendTelegramMessage(chatId, 'У вас пока нет заказов.')
      return
    }
    
    const { data: orders } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          quantity,
          price,
          products (name)
        )
      `)
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (!orders || orders.length === 0) {
      await sendTelegramMessage(chatId, 'У вас пока нет заказов.')
      return
    }
    
    let message = '📋 Ваши последние заказы:\n\n'
    
    orders.forEach((order: any) => {
      const statusEmoji = getStatusEmoji(order.status)
      const date = new Date(order.created_at).toLocaleDateString('ru-RU')
      
      message += `${statusEmoji} Заказ №${order.order_number}\n`
      message += `📅 ${date}\n`
      message += `💰 ${order.total_amount} ₽\n`
      message += `📦 ${order.order_items.length} товар(ов)\n\n`
    })
    
    await sendTelegramMessage(chatId, message)
  } catch (error) {
    console.error('Error fetching orders:', error)
    await sendTelegramMessage(chatId, 'Произошла ошибка при получении заказов.')
  }
}

async function sendHelp(chatId: number) {
  console.log('Sending help to:', chatId)
  const message = `
❓ Помощь

🛍️ *Как сделать заказ:*
1. Откройте каталог товаров
2. Выберите интересующие товары
3. Добавьте их в корзину
4. Оформите заказ

📞 *Поддержка:*
Если у вас есть вопросы, обратитесь к администратору магазина.

🚚 *Доставка:*
Доставка осуществляется по всей России. Стоимость и сроки доставки рассчитываются индивидуально.
  `
  
  await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' })
}

async function sendMainMenu(chatId: number) {
  console.log('Sending main menu to:', chatId)
  await sendTelegramMessage(chatId, 'Выберите действие:', {
    reply_markup: {
      keyboard: [
        [{ text: 'Каталог 📦' }, { text: 'Мои заказы 📋' }],
        [{ text: 'Корзина 🛒' }, { text: 'Помощь ❓' }]
      ],
      resize_keyboard: true,
      persistent: true
    }
  })
}

async function sendTelegramMessage(chatId: number, text: string, extra?: any) {
  console.log(`Attempting to send message to ${chatId}:`, { text, extra })
  
  try {
    // Используем текущий токен бота
    if (!currentBotToken) {
      console.error('No current bot token available')
      return
    }
    
    const telegramApiUrl = `https://api.telegram.org/bot${currentBotToken}/sendMessage`
    
    const payload = {
      chat_id: chatId,
      text: text,
      ...extra
    }
    
    console.log('Sending to Telegram API:', { url: telegramApiUrl, payload })
    
    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      console.error('Telegram API Error:', result)
    } else {
      console.log('Message sent successfully:', result)
    }
  } catch (error) {
    console.error('Error sending message to Telegram:', error)
  }
}

function extractStoreId(startText: string): string | undefined {
  const match = startText.match(/\/start (.+)/)
  return match ? match[1] : undefined
}

function getStatusEmoji(status: string): string {
  switch (status) {
    case 'pending': return '⏳'
    case 'confirmed': return '✅'
    case 'shipped': return '🚚'
    case 'delivered': return '📦'
    case 'cancelled': return '❌'
    default: return '📋'
  }
}

async function showProduct(supabase: any, chatId: number, productId: string) {
  // Показать детали товара
  console.log(`Showing product ${productId} to ${chatId}`)
}

async function addToCart(supabase: any, chatId: number, productId: string) {
  // Добавить товар в корзину
  console.log(`Adding product ${productId} to cart for ${chatId}`)
}

async function showCart(supabase: any, chatId: number) {
  // Показать корзину
  console.log(`Showing cart for ${chatId}`)
}

async function startCheckout(supabase: any, chatId: number) {
  // Начать оформление заказа
  console.log(`Starting checkout for ${chatId}`)
}