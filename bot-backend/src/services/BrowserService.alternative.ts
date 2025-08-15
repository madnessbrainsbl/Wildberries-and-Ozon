import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser, Page } from 'puppeteer';
import { findElementWithSelectors, WB_SELECTORS, OZON_SELECTORS } from '../utils/dom.helpers';
import { CartItem } from '../types';

puppeteer.use(StealthPlugin());

export class BrowserService {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async init() {
    console.log('Initializing browser...');
    
    const isDocker = process.env.NODE_ENV === 'production';
    
    const launchOptions: any = {
      headless: false, // Set to false for debugging
      protocolTimeout: 120000,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--window-size=1920,1080'
      ],
      defaultViewport: { width: 1920, height: 1080 },
      ignoreDefaultArgs: ['--disable-extensions'],
      timeout: 60000
    };

    if (isDocker) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser';
      launchOptions.headless = 'new';
    }
    
    this.browser = await puppeteer.launch(launchOptions);
    this.page = await this.browser.newPage();
    
    // Set viewport and user agent
    await this.page.setViewport({ width: 1920, height: 1080 });
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Set extra headers
    await this.page.setExtraHTTPHeaders({
      'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7'
    });
    
    console.log('Browser initialized successfully');
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  async loginToWildberries(phone: string): Promise<boolean> {
    if (!this.page) throw new Error('Browser not initialized');
    const page = this.page;

    try {
      console.log(`Starting Wildberries login with phone: ${phone}`);

      // 1. Нормализуем номер
      let normalizedPhone = phone.trim();
      if (normalizedPhone.startsWith('8')) {
        normalizedPhone = '+7' + normalizedPhone.substring(1);
      } else if (!normalizedPhone.startsWith('+7')) {
        normalizedPhone = '+7' + normalizedPhone;
      }

      // 2. Переходим на страницу логина WB
      await page.goto('https://www.wildberries.ru/security/login', {
        waitUntil: 'domcontentloaded',
        timeout: 45000
      });

      // 3. Вводим телефон через helper
      const phoneInput = await findElementWithSelectors(page, WB_SELECTORS.phone, 15000);
      await phoneInput.click({ clickCount: 3 });
      await phoneInput.type(normalizedPhone, { delay: 50 });

      // 4. Нажимаем «Получить код»
      try {
        const submitBtn = await findElementWithSelectors(page, WB_SELECTORS.submit, 8000);
        await submitBtn.click();
      } catch {
        await page.keyboard.press('Enter');
      }

      // 5. Ждём поле ввода кода
      await findElementWithSelectors(page, WB_SELECTORS.sms, 40000);

      console.log('SMS code page reached successfully');
      return true;
    } catch (error) {
      console.error('Error during Wildberries login:', error);
      return false;
    }
  }

  async enterWildberriesCode(code: string): Promise<boolean> {
    if (!this.page) throw new Error('Browser not initialized');

    try {
      console.log(`Entering code: ${code}`);
      
      // Enter code using evaluate
      const codeEntered = await this.page.evaluate((code) => {
        const inputs = document.querySelectorAll('input');
        for (let i = 0; i < inputs.length; i++) {
          const input = inputs[i];
          if (input.type === 'number' || input.inputMode === 'numeric' || 
              input.placeholder?.toLowerCase().includes('код')) {
            input.focus();
            input.value = code;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          }
        }
        return false;
      }, code);
      
      if (!codeEntered) {
        console.error('Could not find code input');
        return false;
      }
      
      // Submit code
      await this.page.keyboard.press('Enter');
      
      // Wait for authentication
      await this.page.waitForFunction(() => true, { timeout: 2000 });
      
      // Check if authenticated
      const cookies = await this.page.cookies();
      const hasAuthCookie = cookies.some(cookie => 
        cookie.name.includes('WBToken') || 
        cookie.name.includes('auth')
      );
      
      return hasAuthCookie;
      
    } catch (error) {
      console.error('Error entering code:', error);
      return false;
    }
  }

  // Stub implementations for other methods
  async loginToOzon(phoneOrEmail: string): Promise<boolean> {
    if (!this.page) throw new Error('Browser not initialized');
    const page = this.page;

    try {
      console.log(`Starting Ozon login with credential: ${phoneOrEmail}`);

      // 1. Переходим на главную, чтобы гарантировать корректное состояние
      await page.goto('https://www.ozon.ru/', {
        waitUntil: 'domcontentloaded',
        timeout: 45000
      });

      // 2. Открываем модальное окно входа либо переходим на /login
      try {
        const loginBtn = await findElementWithSelectors(page, OZON_SELECTORS.loginButton, 10000);
        await loginBtn.click();
      } catch {
        console.warn('Login button not found, navigating directly');
        await page.goto('https://www.ozon.ru/login', { waitUntil: 'domcontentloaded', timeout: 45000 });
      }

      // 3. Вводим телефон / email
      const inputField = await findElementWithSelectors(page, OZON_SELECTORS.input, 20000);
      await inputField.type(phoneOrEmail, { delay: 50 });

      // 4. Запрос кода
      try {
        const submitBtn = await findElementWithSelectors(page, OZON_SELECTORS.submit, 8000);
        await submitBtn.click();
      } catch {
        await page.keyboard.press('Enter');
      }

      // 5. Ждём поле ввода кода
      await findElementWithSelectors(page, OZON_SELECTORS.sms, 40000);

      console.log('Ozon SMS code page reached successfully');
      return true;
    } catch (error) {
      console.error('Error during Ozon login:', error);
      return false;
    }
  }

  async enterOzonCode(code: string): Promise<boolean> {
    console.log('Ozon code entry not implemented yet');
    return false;
  }

  async addToCartWildberries(items: CartItem[]): Promise<boolean> {
    return false;
  }

  async addToCartOzon(items: CartItem[]): Promise<boolean> {
    return false;
  }

  async checkoutWildberries(): Promise<string | null> {
    return null;
  }

  async checkoutOzon(): Promise<string | null> {
    return null;
  }

  async saveCookies(): Promise<any[]> {
    if (!this.page) throw new Error('Browser not initialized');
    return await this.page.cookies();
  }

  async loadCookies(cookies: any[]) {
    if (!this.page) throw new Error('Browser not initialized');
    await this.page.setCookie(...cookies);
  }
}
