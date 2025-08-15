import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { wildberriesLogin, ozonLogin } from '../src/utils/dom.helpers';

puppeteer.use(StealthPlugin());

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  try {
    console.log('Testing Wildberries login...');
    const wb = await wildberriesLogin(page, '+77079751816');
    console.log('WB result', wb);

    console.log('Testing Ozon login...');
    const oz = await ozonLogin(page, '+77079751816');
    console.log('Ozon result', oz);
  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
  }
})();
