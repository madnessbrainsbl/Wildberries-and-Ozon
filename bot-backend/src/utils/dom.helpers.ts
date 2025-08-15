import { Page } from 'puppeteer';

// Wildberries selector groups
export const WB_SELECTORS = {
  phone: [
    'input[inputmode="tel"]',
    'input[type="tel"]',
    'input[placeholder*="телефон" i]',
    'input[placeholder*="номер" i]',
    'input[name*="phone"]',
    'input[data-testid*="phone"]',
    '.phone-input input',
    '[class*="phone"] input',
    'input[autocomplete="tel"]'
  ],
  submit: [
    'button:has-text("Получить код")',
    'button:has-text("получить код")',
    'button[type="submit"]',
    'button:has-text("Войти")',
    'button:has-text("Отправить")',
    '[data-testid*="submit"]',
    '.submit-button',
    'form button[type="button"]'
  ],
  sms: [
    'input[placeholder*="код" i]',
    'input[data-testid*="sms"]',
    'input[data-testid*="code"]',
    'input[data-testid*="verification"]',
    'input[type="tel"]:not([placeholder*="телефон" i])',
    '[class*="sms"] input',
    '[class*="code"] input',
    '[class*="verification"] input',
    'input[maxlength="4"]',
    'input[maxlength="5"]',
    'input[maxlength="6"]',
    'input[pattern="[0-9]*"]'
  ]
};

// Ozon selector groups
export const OZON_SELECTORS = {
  loginButton: [
    'button:has-text("Войти")',
    'a:has-text("Войти")',
    'button:has-text("Вход")',
    '[data-testid*="login"]',
    '[data-testid*="auth"]',
    '.login-button',
    '[class*="login"] button',
    '[class*="auth"] button',
    '[href*="login"]',
    '[href*="auth"]',
    'button:has-text("Регистрация")',
    'span:has-text("Войти")'
  ],
  input: [
    'input[type="tel"]',
    'input[type="email"]',
    'input[placeholder*="телефон" i]',
    'input[placeholder*="почт" i]',
    'input[placeholder*="номер" i]',
    'input[name*="phone"]',
    'input[name*="email"]',
    'input[name*="login"]',
    '[data-testid*="phone"] input',
    '[data-testid*="email"] input',
    '[data-testid*="login"] input',
    '.phone-input input',
    '.email-input input',
    '[class*="input"] input[type="text"]'
  ],
  submit: [
    'button:has-text("Получить код")',
    'button:has-text("Войти")',
    'button:has-text("Продолжить")',
    'button[type="submit"]',
    '[data-testid*="submit"]',
    '.submit-button',
    'form button'
  ],
  sms: [
    'input[type="tel"][maxlength="6"]',
    'input[type="number"]',
    'input[autocomplete="one-time-code"]',
    'input[inputmode="numeric"]',
    'input[placeholder*="код" i]'
  ]
};

/**
 * Tries each selector in sequence until an element is found.
 * Returns the element handle or throws after trying all selectors.
 */
export async function findElementWithSelectors(
  page: Page,
  selectors: string[],
  totalTimeout = 10000
) {
  const start = Date.now();
  for (const selector of selectors) {
    const remaining = totalTimeout - (Date.now() - start);
    if (remaining <= 0) break;
    try {
      const el = await page.waitForSelector(selector, { timeout: Math.min(2000, remaining) });
      if (el) {
        console.log(`✅ Found element with selector: ${selector}`);
        return el;
      }
    } catch (_e) {
      console.log(`⏩ Selector not found: ${selector}`);
    }
  }
  throw new Error(`None of the selectors matched within ${totalTimeout}ms`);
}

