import https from 'https';

// Ключ для проверки
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6cmFmZXhsYWxham9pcnp1Z2RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Mjk0MDMsImV4cCI6MjA2OTMwNTQwM30.rrKmafrLhQWNk7bIC5kfoO5pcvEkzO2i_THc5_Ep3nk';
const SUPABASE_URL = 'https://kzrafexlalajoirzugdj.supabase.co';

async function testSupabaseKey() {
    console.log('Проверка ключа Supabase Anon...');
    console.log(`URL: ${SUPABASE_URL}`);
    console.log(`Ключ: ${ANON_KEY.substring(0, 10)}...${ANON_KEY.substring(ANON_KEY.length - 4)}`);
    
    const url = new URL(`${SUPABASE_URL}/rest/v1/`);
    
    const options = {
        hostname: url.hostname,
        path: url.pathname,
        method: 'GET',
        headers: {
            'apikey': ANON_KEY,
            'Authorization': `Bearer ${ANON_KEY}`,
            'Content-Type': 'application/json'
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log(`\nСтатус ответа: ${res.statusCode}`);
                console.log(`Заголовки: ${JSON.stringify(res.headers, null, 2)}`);
                
                if (res.statusCode === 200) {
                    console.log('\n✅ Ключ действителен! Соединение с Supabase успешно установлено.');
                } else if (res.statusCode === 401) {
                    console.log('\n❌ Ошибка аутентификации! Ключ недействителен или отозван.');
                } else if (res.statusCode === 403) {
                    console.log('\n❌ Доступ запрещен! Ключ не имеет необходимых прав.');
                } else {
                    console.log(`\n⚠️ Неожиданный статус ответа: ${res.statusCode}`);
                }
                
                if (data) {
                    console.log('\nОтвет сервера:', data);
                }
                
                resolve();
            });
        });
        
        req.on('error', (error) => {
            console.error('\n❌ Ошибка при подключении:', error.message);
            reject(error);
        });
        
        req.end();
    });
}

// Запуск теста
testSupabaseKey()
    .then(() => {
        console.log('\n✅ Тест завершен');
    })
    .catch((error) => {
        console.error('\n❌ Тест завершен с ошибкой:', error);
    });
