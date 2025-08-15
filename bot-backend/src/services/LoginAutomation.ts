import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser, Page, HTTPResponse } from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

puppeteer.use(StealthPlugin());

export interface LoginResult {
  success: boolean;
  message: string;
  [key: string]: unknown;
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export class LoginAutomation {
  private browser: Browser | null = null;
  private page: Page | null = null;

  /** Initialise Chromium */
  async init(headless = true): Promise<void> {
    this.browser = await puppeteer.launch({
      headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    this.page = await this.browser.newPage();
    await this.page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    await this.page.setViewport({ width: 1366, height: 768 });
  }

  async close(): Promise<void> {
    if (this.browser) await this.browser.close();
    this.browser = null;
    this.page = null;
  }

  /* -------------------------------------------------- utils */
  private async screenshotsDir(): Promise<string> {
    const dir = path.join(process.cwd(), 'screenshots');
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
    return dir;
  }

  private async snap(name: string): Promise<string> {
    if (!this.page) throw new Error('page not initialised');
    const dir = await this.screenshotsDir();
    const file = path.join(dir, `${name}-${Date.now()}.png`);
    await this.page.screenshot({ path: file, fullPage: true });
    return file;
  }

  /* -------------------------------------------------- Wildberries */
  async wildberriesLogin(phone: string): Promise<LoginResult> {
    if (!this.page) throw new Error('page not initialised');
    const page = this.page;

    try {
      await page.goto('https://www.wildberries.ru/security/login', {
        waitUntil: 'networkidle0',
        timeout: 30000
      });
      await delay(3000);

      // phone input - Updated with correct selectors
      const phoneInputSelectors = [
        'input[placeholder="Найти на Wildberries"]',
        'input[data-qa="phone-input"]',
        'input[inputmode="tel"]',
        'input[name="phone"]',
        'input[type="tel"]'
      ];
      const phoneInput = await page.waitForSelector(phoneInputSelectors.join(','), {
        timeout: 10000
      });
      await phoneInput!.click({ clickCount: 3 });
      await phoneInput!.type(phone, { delay: 100 });

      // submit button - Updated with correct selectors
      const submitSelectors = [
        'button:has-text("Получить код")',
        'button[type="submit"]',
        'button[data-qa="send-code-btn"]',
        'button[data-qa="login-button"]',
        'button[data-qa="get-code-button"]'
      ];
      const submitBtn = await page.waitForSelector(submitSelectors.join(','), {
        timeout: 5000
      });
      await Promise.all([
        page.waitForResponse((r: HTTPResponse) =>
          r.url().includes('wildberries.ru') && [200, 302].includes(r.status())
        ).catch(() => {}),
        submitBtn!.click()
      ]);

      // wait for sms input (iterate selectors) - Updated
      const smsSelectors = [
        'input[inputmode="numeric"]',
        'input[name="code"]',
        'input[data-qa="sms-code-input"]',
        'input[placeholder*="код" i]',
        'input[data-testid*="sms" i]',
        'input[data-testid*="code" i]',
        'input[data-testid*="verification" i]',
        'input[type="text"][maxlength="4"],input[type="text"][maxlength="5"],input[type="text"][maxlength="6"]',
        'input[type="tel"]:not([placeholder*="телефон" i])',
        '.verification input',
        '.sms input',
        '.code input',
        '[class*="sms"] input',
        '[class*="code"] input',
        '[class*="verification"] input'
      ];
      let found = null;
      for (let i = 0; i < 30 && !found; i++) {
        for (const sel of smsSelectors) {
          found = await page.$(sel);
          if (found && (await found.isIntersectingViewport())) break;
        }
        if (!found) await delay(1000);
      }

      if (found) {
        await this.snap('wildberries-sms-ready');
        return { success: true, message: 'SMS input ready' };
      }

      await this.snap('wildberries-sms-not-found');
      return { success: false, message: 'SMS input not found' };
    } catch (e: any) {
      await this.snap('wildberries-error');
      return { success: false, message: e.message };
    }
  }

  /* Compatibility wrappers expected by BotController */
  async loginToWildberries(phone: string) { return (await this.wildberriesLogin(phone)).success; }
  async loginToOzon(phone: string | undefined) { return (await this.ozonLogin(String(phone))).success; }

  async enterWildberriesCode(code: string): Promise<boolean> {
    if (!this.page) return false;
    try {
      const input = await this.page.$('input[inputmode="numeric"],input[type="tel"],input[type="text"]');
      await input?.click({ clickCount: 3 });
      await input?.type(code, { delay: 50 });
      await input?.press('Enter');
      await delay(2000);
      return true;
    } catch { return false; }
  }
  async enterOzonCode(code: string): Promise<boolean> {
    return this.enterWildberriesCode(code);
  }

  async saveCookies() {
    return this.page ? await this.page.cookies() : [];
  }
  async loadCookies(cookies: any[]) {
    if (this.page) await this.page.setCookie(...cookies);
  }

  /* -------------------------------------------------- Ozon */
  async ozonLogin(phone: string): Promise<LoginResult> {
    if (!this.page) throw new Error('page not initialised');
    const page = this.page;
    try {
      await page.goto('https://www.ozon.ru', { waitUntil: 'networkidle0', timeout: 30000 });
      await delay(3000);

      const loginSelectors = [
        'button[data-widget="headerProfile"]',
        '[data-widget="profileMenuTrigger"]',
        '[data-widget="header.loginButton"]',
        'button:has-text("Войти")',
        'a:has-text("Войти")',
        'a[href*="login"]',
        'span:has-text("Войти")',
        '[aria-label*="Войти"]'
      ];
      let loginBtn = null;
      for (const sel of loginSelectors) {
        loginBtn = await page.$(sel);
        if (loginBtn && (await loginBtn.isIntersectingViewport())) break;
      }
      if (loginBtn) {
        await loginBtn.click();
        await delay(3000);
      } else {
        await page.goto('https://www.ozon.ru/my/login', { waitUntil: 'networkidle0', timeout: 20000 });
      }

      await delay(2000);

      const inputSelectors = [
        'input[type="tel"]',
        'input[type="email"]',
        'input[name="phone"]',
        'input[name="email"]',
        'input[placeholder*="телефон"]',
        'input[placeholder*="почта"]',
        'input[data-qa="phone-input"]',
        'input[data-qa="email-input"]',
        'input[data-testid="phone-input"]'
      ];
      let phoneInput = null;
      for (const sel of inputSelectors) {
        phoneInput = await page.$(sel);
        if (phoneInput && (await phoneInput.isIntersectingViewport())) break;
      }
      if (!phoneInput) {
        await this.snap('ozon-no-input');
        return { success: false, message: 'Input field not found' };
      }
      await phoneInput.type(phone, { delay: 100 });

      const submitSelectors = [
        'button[type="submit"]',
        'button:has-text("Войти")',
        'button:has-text("Получить код")',
        'button[data-qa="login-button"]',
        'button[data-qa="get-code-button"]',
        'button:has-text("Продолжить")',
        'button[data-qa="sendCodeBtn"]'
      ];
      let submitBtn = null;
      for (const sel of submitSelectors) {
        submitBtn = await page.$(sel);
        if (submitBtn && (await submitBtn.isIntersectingViewport())) break;
      }
      if (submitBtn) await submitBtn.click(); else await phoneInput.press('Enter');
      await delay(3000);
      return { success: true, message: 'Form submitted' };
    } catch (e: any) {
      await this.snap('ozon-error');
      return { success: false, message: e.message };
    }
  }
}

