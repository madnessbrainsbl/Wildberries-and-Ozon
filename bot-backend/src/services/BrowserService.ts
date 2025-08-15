import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser, Page } from 'puppeteer';
import { CartItem } from '../types';

// Updated version with improved Wildberries authentication - v2.0

puppeteer.use(StealthPlugin());

export class BrowserService {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private storedCookies: string | null = null;

  /**
   * Инициализирует браузер. Если переданы cookiesJson – восстанавливает сессию.
   */
  async init(cookiesJson?: string) {
    console.log('Initializing browser...');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Executable path env:', process.env.PUPPETEER_EXECUTABLE_PATH);
    
    // Check if running in Docker or locally
    const isDocker = process.env.NODE_ENV === 'production';
    const isHeadless = process.env.HEADLESS_BROWSER === 'true';
    
const launchOptions: any = {
      headless: true,
      protocolTimeout: 180000, // Increase timeout to 3 minutes for better stability
      args: [
        '--headless=new',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=VizDisplayCompositor',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-ipc-flooding-protection',
        '--window-size=1920,1080'
      ],
      defaultViewport: { width: 1920, height: 1080 },
      ignoreDefaultArgs: ['--disable-extensions'],
      timeout: 60000
    };

    // Use system Chrome/Chromium when running locally
    if (!isDocker) {
      // Try to find Chrome/Chromium on Windows
      const possiblePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files\\Google\\Chrome Beta\\Application\\chrome.exe',
        'C:\\Program Files\\Google\\Chrome Dev\\Application\\chrome.exe'
      ];
      
      for (const path of possiblePaths) {
        try {
          const fs = require('fs');
          if (fs.existsSync(path)) {
            launchOptions.executablePath = path;
            console.log(`Found Chrome at: ${path}`);
            break;
          }
        } catch (e) {
          // Continue searching
        }
      }
    } else {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser';
    }
    
    try {
      console.log('Launch options:', JSON.stringify(launchOptions, null, 2));
      this.browser = await puppeteer.launch(launchOptions);
    } catch (error) {
      console.error('Failed to launch browser:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      console.log('Retrying with minimal options...');
      
      // Retry with minimal options
      const minimalOptions: any = {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: launchOptions.executablePath
      };
      
      try {
        this.browser = await puppeteer.launch(minimalOptions);
      } catch (retryError) {
        console.error('Retry also failed:', retryError);
        throw retryError;
      }
    }
    
    this.page = await this.browser.newPage();

    // Если есть сохранённые cookies – устанавливаем перед переходом на сайты
    if (cookiesJson) {
      try {
        const cookies = JSON.parse(cookiesJson);
        await this.page.setCookie(...cookies);
        this.storedCookies = cookiesJson;
      } catch (_) {
        console.warn('Failed to parse cookiesJson, starting fresh session');
      }
    }
    
    // Set viewport and user agent
    await this.page.setViewport({ width: 1920, height: 1080 });
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
    
    // Set extra headers to avoid detection
    await this.page.setExtraHTTPHeaders({
      'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7'
    });
    
    // Enable stealth mode
    await this.page.evaluateOnNewDocument(() => {
      // Override the navigator.webdriver property
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
      });
    });
    
    console.log('Browser initialized successfully');

    return true;
  }

  /** Закрыть браузер */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  /**
   * Запускает процесс логина и ждёт появления формы ввода кода.
   * Код должен быть передан позднее через verifyCode().
   */
  async loginToWildberries(phone: string): Promise<boolean> {
    if (!this.page) throw new Error('Browser not initialized');

    try {
      console.log(`Starting Wildberries login with phone: ${phone}`);
      
      // Normalize phone format
      let normalizedPhone = phone.trim();
      if (normalizedPhone.startsWith('8')) {
        normalizedPhone = '+7' + normalizedPhone.substring(1);
      } else if (!normalizedPhone.startsWith('+7')) {
        normalizedPhone = '+7' + normalizedPhone;
      }
      console.log(`Using normalized phone: ${normalizedPhone}`);
      
      // Try multiple login URLs
      const loginUrls = [
        'https://www.wildberries.ru/security/login',
        'https://www.wildberries.ru/login',
        'https://www.wildberries.ru/profile/login'
      ];
      
      let loginPageLoaded = false;
      for (const url of loginUrls) {
        try {
          console.log(`Trying login URL: ${url}`);
          await this.page.goto(url, { 
            waitUntil: 'domcontentloaded',
            timeout: 30000 
          });
          
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          const currentUrl = this.page.url();
          console.log(`Current URL after navigation: ${currentUrl}`);
          
          const hasLoginForm = await this.page.evaluate(() => {
            const selectors = [
              'input[type="tel"]',
              'input[name="phone"]',
              'input[placeholder*="телефон"]',
              'input[placeholder*="Телефон"]',
              'input[inputmode="tel"]'
            ];
            
            for (const selector of selectors) {
              if (document.querySelector(selector)) {
                return true;
              }
            }
            return false;
          });
          
          if (hasLoginForm) {
            console.log('Login form found on this page');
            loginPageLoaded = true;
            break;
          } else {
            console.log('No login form found, trying next URL...');
          }
        } catch (e) {
          console.log(`Failed to load ${url}: ${e}`);
        }
      }
      
      if (!loginPageLoaded) {
        console.error('Could not find login page with form');
        return false;
      }
      
      let phoneInputFound = false;
      const phoneSelectors = [
        'input[type="tel"]',
        'input[name="phone"]',
        'input[placeholder*="телефон"]',
        'input[placeholder*="Телефон"]',
        'input[placeholder*="номер"]',
        'input[inputmode="tel"]',
        'input.phone-input',
        '[data-testid="phone-input"]',
        '#phone',
        '.phone'
      ];
      
      console.log('Looking for phone input field...');
      for (const selector of phoneSelectors) {
        try {
          const element = await this.page.$(selector);
          if (element) {
            const isVisible = await element.isIntersectingViewport();
            if (isVisible) {
              console.log(`Found visible phone input with selector: ${selector}`);
              
              await element.focus();
              await new Promise(resolve => setTimeout(resolve, 500));
              
              await this.page.keyboard.down('Control');
              await this.page.keyboard.press('KeyA');
              await this.page.keyboard.up('Control');
              await this.page.keyboard.press('Delete');
              await new Promise(resolve => setTimeout(resolve, 500));
              
              await element.type(normalizedPhone, { delay: 150 });
              
              phoneInputFound = true;
              console.log(`Successfully entered phone number: ${normalizedPhone}`);
              break;
            }
          }
        } catch (e) {
          console.log(`Phone selector ${selector} not found or not accessible`);
        }
      }
      
      if (!phoneInputFound) {
        console.error('Could not find any phone input field');
        return false;
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Try XPath selectors for button text
      const submitSelectors = [
        'button[type="submit"]',
        '.btn-main',
        '.btn-primary',
        '.submit-btn',
        '[data-testid="submit-button"]'
      ];
      
      let buttonClicked = false;
      for (const selector of submitSelectors) {
        try {
          const button = await this.page.$(selector);
          if (button) {
            const isVisible = await button.isIntersectingViewport();
            const isEnabled = await button.evaluate(el => !(el as HTMLButtonElement).disabled);
            
            if (isVisible && isEnabled) {
              console.log(`Found and clicking submit button: ${selector}`);
              await button.click();
              buttonClicked = true;
              break;
            }
          }
        } catch (e) {
          console.log(`Submit selector ${selector} not found`);
        }
      }
      
      // Try XPath for button text
      if (!buttonClicked) {
        const buttonTexts = ['Получить код', 'Продолжить', 'Войти', 'Далее', 'Отправить код', 'Подтвердить'];
        for (const text of buttonTexts) {
          try {
            const buttons = await this.page.$$('button');
            let button = null;
            for (const btn of buttons) {
              const btnText = await btn.evaluate(el => el.textContent?.trim());
              if (btnText && btnText.includes(text)) {
                button = btn;
                break;
              }
            }
            if (button) {
              console.log(`Found button with text: ${text}`);
              await button.click();
              buttonClicked = true;
              break;
            }
          } catch (e) {
            console.log(`Button with text '${text}' not found`);
          }
        }
      }
      
      if (!buttonClicked) {
        console.log('No submit button found, trying Enter key...');
        await this.page.keyboard.press('Enter');
        buttonClicked = true;
      }
      
      console.log('Waiting for page response after submit...');
await new Promise(resolve => setTimeout(resolve, 5000));
      // wait URL change to sms/otp
      try {
        await this.page.waitForFunction(() => location.href.includes('sms') || location.href.includes('otp'), {timeout: 15000});
      } catch(_){ }

      // wait inline div input sms
      try {
        await this.page.waitForSelector('input[type="tel"][maxlength="6"], div[data-qa="otp"] input', {timeout:15000});
        console.log('WB: SMS inline input detected');
        return true;
      } catch(_){}
      
      // Take screenshot for debugging
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        await this.page.screenshot({ 
          path: `D:\\project\\screenshots\\wildberries-after-submit-${timestamp}.png`,
          fullPage: true 
        });
        console.log(`Screenshot saved to D:\\project\\screenshots\\wildberries-after-submit-${timestamp}.png`);
      } catch (e) {
        console.log('Could not take debug screenshot:', e);
      }
      
      // Wait for possible SMS iframe/modal after submit
      try {
        const iframeElem = await this.page.waitForSelector('iframe[src*="otp"], iframe[src*="login"]', { timeout: 15000 });
        if (iframeElem) {
          const frame = await iframeElem.contentFrame();
          if (frame) {
            const codeField = await frame.waitForSelector('input[type="tel"], input[inputmode="numeric"], input[name="code"]', { timeout: 15000 });
            if (codeField) {
              console.log('SMS code iframe detected');
              return true;
            }
          }
        }
      } catch (_) { /* ignore */ }

      // Wait for possible SMS input directly on the page
      try {
        await this.page.waitForSelector(
          'input[inputmode="numeric"], input[name="code"], input[name="smsCode"]',
          { timeout: 15000 }
        );
        console.log('SMS code input detected (inline)');
        return true;
      } catch (_) {}

      // Check for captcha
      const captchaSelectors = [
        'iframe[src*="captcha"]',
        'div[class*="captcha"]',
        '[data-testid="captcha"]',
        '.g-recaptcha',
        '#captcha',
        'img[alt*="капча"]',
        'img[alt*="captcha"]'
      ];
      
      for (const selector of captchaSelectors) {
        try {
          const captchaElement = await this.page.$(selector);
          if (captchaElement) {
            console.error('CAPTCHA detected! Manual intervention required.');
            return false;
          }
        } catch (e) {
          // Continue checking
        }
      }
      
      const errorSelectors = [
        '.error-message',
        '.validation-error',
        '.error',
        '[data-testid="error"]',
        '.text-danger',
        '.alert-danger'
      ];
      
      for (const selector of errorSelectors) {
        try {
          const errorElement = await this.page.$(selector);
          if (errorElement) {
            const errorText = await errorElement.evaluate(el => el.textContent?.trim());
            if (errorText) {
              console.error('Found error message:', errorText);
              return false;
            }
          }
        } catch (e) {
          // Continue checking
        }
      }
      
      const codeSelectors = [
        'input[inputmode="numeric"]',
        'input[type="number"]',
        'input[name="code"]',
        'input[name="smsCode"]',
        'input[placeholder*="код"]',
        'input[placeholder*="Код"]',
        '.code-input',
        '[data-testid="code-input"]',
        '#code',
        '#smsCode'
      ];
      
      let codeInputFound = false;
      for (const selector of codeSelectors) {
        try {
          const element = await this.page.$(selector);
          if (element) {
            const isVisible = await element.isIntersectingViewport();
            if (isVisible) {
              console.log(`Found visible code input with selector: ${selector}`);
              codeInputFound = true;
              break;
            }
          }
        } catch (e) {
          console.log(`Code selector ${selector} not found`);
        }
      }
      
      if (codeInputFound) {
        console.log('SMS code page reached successfully');
        return true;
      } else {
        console.error('Could not find SMS code input after form submission');
        
        const finalUrl = this.page.url();
        console.log(`Final URL: ${finalUrl}`);
        
        const pageTitle = await this.page.title();
        console.log(`Page title: ${pageTitle}`);
        
        return false;
      }
      
    } catch (error) {
      console.error('Error during Wildberries login:', error);
      
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        await this.page.screenshot({ 
          path: `D:\\project\\wildberries-login-error-${timestamp}.png`,
          fullPage: true 
        });
        console.log(`Error screenshot saved to D:\\project\\wildberries-login-error-${timestamp}.png`);
      } catch (screenshotError) {
        console.error('Could not take screenshot:', screenshotError);
      }
      
      return false;
    }
  }

  async enterWildberriesCode(code: string): Promise<boolean> {
    if (!this.page) throw new Error('Browser not initialized');

    try {
      console.log(`Entering Wildberries verification code: ${code}`);
      
      const codeSelectors = [
        'input[inputmode="numeric"]',
        'input[type="number"]',
        'input[name="code"]',
        'input[name="smsCode"]',
        'input[placeholder*="код"]',
        'input[placeholder*="Код"]',
        '.code-input',
        '[data-testid="code-input"]',
        '#code',
        '#smsCode'
      ];
      
      let codeEntered = false;
      for (const selector of codeSelectors) {
        try {
          const element = await this.page.$(selector);
          if (element) {
            const isVisible = await element.isIntersectingViewport();
            if (isVisible) {
              console.log(`Found code input with selector: ${selector}`);
              
              await element.focus();
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // Clear existing content
              await this.page.keyboard.down('Control');
              await this.page.keyboard.press('KeyA');
              await this.page.keyboard.up('Control');
              await this.page.keyboard.press('Delete');
              
              await element.type(code, { delay: 150 });
              codeEntered = true;
              console.log('Code entered successfully');
              break;
            }
          }
        } catch (e) {
          console.log(`Code selector ${selector} not found`);
        }
      }
      
      if (!codeEntered) {
        console.error('Could not find code input field');
        return false;
      }
      
      // Try to find and click submit button if exists
      const submitSelectors = [
        'button[type="submit"]',
        'button:contains("Подтвердить")',
        'button:contains("Войти")',
        'button:contains("Далее")',
        '.btn',
        '.btn-primary'
      ];
      
      let submitted = false;
      for (const selector of submitSelectors) {
        try {
          const button = await this.page.$(selector);
          if (button) {
            const isVisible = await button.isIntersectingViewport();
            const isEnabled = await button.evaluate(el => !(el as HTMLButtonElement).disabled);
            
            if (isVisible && isEnabled) {
              console.log(`Clicking submit button: ${selector}`);
              await button.click();
              submitted = true;
              break;
            }
          }
        } catch (e) {
          // Continue trying
        }
      }
      
      if (!submitted) {
        console.log('No submit button found, trying Enter key...');
        await this.page.keyboard.press('Enter');
      }
      
      // Wait for response
      console.log('Waiting for authentication response...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Check for error messages
      const errorSelectors = [
        '.error-message',
        '.validation-error',
        '.error',
        '[data-testid="error"]',
        '.text-danger',
        '.alert-danger'
      ];
      
      for (const selector of errorSelectors) {
        try {
          const errorElement = await this.page.$(selector);
          if (errorElement) {
            const errorText = await errorElement.evaluate(el => el.textContent?.trim());
            if (errorText && errorText.length > 0) {
              console.error('Found error message:', errorText);
              return false;
            }
          }
        } catch (e) {
          // Continue checking
        }
      }
      
      // Check if we're redirected to main page or profile
      const currentUrl = this.page.url();
      console.log(`Current URL after code entry: ${currentUrl}`);
      
      // Check for authentication cookies
      const cookies = await this.page.cookies();
      const hasAuthCookie = cookies.some(cookie => 
        cookie.name.includes('WBToken') || 
        cookie.name.includes('access_token') ||
        cookie.name.includes('auth') ||
        cookie.name.includes('session')
      );
      
      if (hasAuthCookie) {
        console.log('Authentication successful - found auth cookies');
        return true;
      }
      
      // Check if URL indicates successful login
      const successUrls = [
        'wildberries.ru/profile',
        'wildberries.ru/lk',
        'wildberries.ru/my'
      ];
      
      const isOnSuccessPage = successUrls.some(url => currentUrl.includes(url));
      if (isOnSuccessPage) {
        console.log('Authentication successful - redirected to profile page');
        return true;
      }
      
      // If we're still on login/code page, authentication failed
      const stillOnLoginPage = currentUrl.includes('login') || currentUrl.includes('security');
      if (stillOnLoginPage) {
        console.log('Still on login page, authentication failed');
        return false;
      }
      
      console.log('Authentication status unclear, assuming success');
      return true;
      
    } catch (error) {
      console.error('Error entering Wildberries code:', error);
      
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        await this.page.screenshot({ 
          path: `D:\\project\\wildberries-code-error-${timestamp}.png`,
          fullPage: true 
        });
        console.log(`Code error screenshot saved to D:\\project\\wildberries-code-error-${timestamp}.png`);
      } catch (screenshotError) {
        console.error('Could not take screenshot:', screenshotError);
      }
      
      return false;
    }
  }

  async loginToOzon(phoneOrEmail: string): Promise<boolean> {
    if (!this.page) throw new Error('Browser not initialized');

    try {
      console.log('Navigating to Ozon login page...');
      await this.page.goto('https://www.ozon.ru/', { waitUntil: 'networkidle2' });
      
      // Wait a bit for page to load completely
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Try to find and click login button
console.log('Looking for login button...');
      // open burger menu if exists
      try {
const burger = await this.page.$('[data-widget="burgerButton"]');
        if (burger){ await burger.click(); await new Promise(r=>setTimeout(r,500)); } 
      }catch(_){}
      const loginSelectors = [
        '[data-widget="profileMenuAnonymous"]',
        '[data-widget="login"]',
'button:has-text("Войти")',
        'a[href*="/login"]',
        'button:has-text("Войти / Регистрация")',
        'button:has-text("Войти или регистрация")',
        '[aria-label*="Войти"]',
        '.tsBodyL:has-text("Войти")'
      ];
      
      let loginClicked = false;
      for (const selector of loginSelectors) {
        try {
          const element = await this.page.$(selector);
          if (element) {
            console.log(`Found login button with selector: ${selector}`);
            await element.click();
            loginClicked = true;
            break;
          }
        } catch (e) {
          console.log(`Selector ${selector} not found`);
        }
      }
      
      if (!loginClicked) {
        console.log('Could not find login button, trying direct navigation...');
        await this.page.goto('https://www.ozon.ru/my/main', { waitUntil: 'networkidle2' });
      }
      
      // Wait for login modal/page to appear
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Try different input selectors
      console.log('Attempting refresh if input not found...');
      try {
        await this.page.reload({ waitUntil: 'networkidle0', timeout: 60000 });
      } catch (reloadError) {
        console.error('Reload failed:', reloadError);
      }

      console.log('Looking for phone/email input...');
      const inputSelectors = [
        'input[type="tel"]',
        'input[type="text"]',
        'input[name="phone"]',
        'input[name="contact"]',
        'input[placeholder*="Телефон"], input[placeholder*="телефон"], input[placeholder*="Телефон или email"]',
        'input[inputmode="tel"]'
      ];
      
      let inputFound = false;
      for (const selector of inputSelectors) {
        try {
          const element = await this.page.$(selector);
          if (element) {
            console.log(`Found input with selector: ${selector}`);
            await element.click();
            await element.type(phoneOrEmail);
            inputFound = true;
            break;
          }
        } catch (e) {
          console.log(`Input selector ${selector} not found`);
        }
      }
      
      if (!inputFound) {
        console.error('Could not find phone/email input field');
        return false;
      }
      
      // Try to find and click submit button
      console.log('Looking for submit button...');
      const submitSelectors = [
        'button[type="submit"]',
        'button:has-text("Получить код")',
        'button:has-text("Продолжить")',
        'button:has-text("Далее")'
      ];
      
      let submitClicked = false;
      for (const selector of submitSelectors) {
        try {
          const element = await this.page.$(selector);
          if (element) {
            console.log(`Found submit button with selector: ${selector}`);
            await element.click();
            submitClicked = true;
            break;
          }
        } catch (e) {
          console.log(`Submit selector ${selector} not found`);
        }
      }
      
      if (!submitClicked) {
        console.error('Could not find submit button');
        return false;
      }
      
      // Wait for code input
      console.log('Waiting for verification code input...');
      await this.page.waitForSelector('input[inputmode="numeric"]', { timeout: 15000 });
      console.log('Successfully reached verification code page');
      
      return true;
    } catch (error) {
      console.error('Error during Ozon login:', error);
      // Take a screenshot for debugging
      try {
        await this.page.screenshot({ path: '/tmp/ozon-login-error.png' });
        console.log('Screenshot saved to /tmp/ozon-login-error.png');
      } catch (screenshotError) {
        console.error('Could not take screenshot:', screenshotError);
      }
      return false;
    }
  }

  async enterOzonCode(code: string): Promise<boolean> {
    if (!this.page) throw new Error('Browser not initialized');

    try {
      // Enter verification code
      const codeInputs = await this.page.$$('input[inputmode="numeric"]');
      for (let i = 0; i < code.length && i < codeInputs.length; i++) {
        await codeInputs[i].type(code[i]);
      }
      
      // Wait for navigation
      await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
      
      // Check if logged in
      const cookies = await this.page.cookies();
      return cookies.some(cookie => cookie.name.includes('__Secure-access-token'));
    } catch (error) {
      console.error('Error entering Ozon code:', error);
      return false;
    }
  }

  async addToCartWildberries(items: CartItem[]): Promise<boolean> {
    if (!this.page) throw new Error('Browser not initialized');

    try {
      for (const item of items) {
        // Navigate to product page
        await this.page.goto(`https://www.wildberries.ru/catalog/${item.product.sku}/detail.aspx`, { waitUntil: 'networkidle2' });
        
        // Set quantity if more than 1
        if (item.quantity > 1) {
          const quantityInput = await this.page.$('input[name="quantity"]');
          if (quantityInput) {
            await quantityInput.click({ clickCount: 3 });
            await quantityInput.type(item.quantity.toString());
          }
        }
        
        // Add to cart
        await this.page.click('button[data-link="class{basketContent}"]');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      return true;
    } catch (error) {
      console.error('Error adding to Wildberries cart:', error);
      return false;
    }
  }

  async addToCartOzon(items: CartItem[]): Promise<boolean> {
    if (!this.page) throw new Error('Browser not initialized');

    try {
      for (const item of items) {
        // Navigate to product page
        await this.page.goto(`https://www.ozon.ru/product/${item.product.sku}`, { waitUntil: 'networkidle2' });
        
        // Set quantity
        if (item.quantity > 1) {
          const plusButton = await this.page.$('button[aria-label="Добавить один товар"]');
          if (plusButton) {
            for (let i = 1; i < item.quantity; i++) {
              await plusButton.click();
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        }
        
        // Add to cart
        await this.page.click('button:has-text("Добавить в корзину")');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      return true;
    } catch (error) {
      console.error('Error adding to Ozon cart:', error);
      return false;
    }
  }

  async checkoutWildberries(): Promise<string | null> {
    if (!this.page) throw new Error('Browser not initialized');

    try {
      // Go to cart
      await this.page.goto('https://www.wildberries.ru/lk/basket', { waitUntil: 'networkidle2' });
      
      // Click checkout
      await this.page.click('button[data-link="class{checkoutButton}"]');
      await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
      
      // Complete checkout steps
      // Select delivery method if needed
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Confirm order
      await this.page.click('button[data-link="class{confirmOrder}"]');
      await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
      
      // Get order number
      const orderNumberElement = await this.page.$('.order-number');
      if (orderNumberElement) {
        const orderNumber = await orderNumberElement.evaluate(el => el.textContent);
        return orderNumber?.trim() || null;
      }
      
      return null;
    } catch (error) {
      console.error('Error during Wildberries checkout:', error);
      return null;
    }
  }

  async checkoutOzon(): Promise<string | null> {
    if (!this.page) throw new Error('Browser not initialized');

    try {
      // Go to cart
      await this.page.goto('https://www.ozon.ru/cart', { waitUntil: 'networkidle2' });
      
      // Click checkout
      await this.page.click('button:has-text("Перейти к оформлению")');
      await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
      
      // Wait for checkout page
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Confirm order
      await this.page.click('button:has-text("Подтвердить заказ")');
      await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
      
      // Get order number
      const orderNumberElement = await this.page.$('[data-widget="orderNumber"]');
      if (orderNumberElement) {
        const orderNumber = await orderNumberElement.evaluate(el => el.textContent);
        return orderNumber?.trim() || null;
      }
      
      return null;
    } catch (error) {
      console.error('Error during Ozon checkout:', error);
      return null;
    }
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
