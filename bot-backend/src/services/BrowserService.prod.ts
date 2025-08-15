import { CartItem } from '../types';

// Stub version of BrowserService for production
// Real browser automation should be handled by a separate service

export class BrowserService {
  private isInitialized = false;

  async init() {
    if (this.isInitialized) {
      console.log('Browser service already initialized (stub mode)');
      return;
    }
    console.log('Browser service initialized (stub mode)');
    this.isInitialized = true;
  }

  async close() {
    console.log('Browser service closed');
    this.isInitialized = false;
  }

  async loginToWildberries(phone: string): Promise<boolean> {
    console.log(`Wildberries login requested for phone: ${phone}`);
    console.log('Simulating successful login for stub mode');
    // Return true to simulate successful login request
    return true;
  }

  async enterWildberriesCode(code: string): Promise<boolean> {
    console.log(`Wildberries code verification requested: ${code}`);
    console.log('Simulating successful code verification for stub mode');
    // Return true to simulate successful verification
    return true;
  }

  async loginToOzon(phoneOrEmail: string): Promise<boolean> {
    console.log(`Ozon login requested for: ${phoneOrEmail}`);
    console.log('Simulating successful login for stub mode');
    // Return true to simulate successful login request
    return true;
  }

  async enterOzonCode(code: string): Promise<boolean> {
    console.log(`Ozon code verification requested: ${code}`);
    console.log('Simulating successful code verification for stub mode');
    // Return true to simulate successful verification
    return true;
  }

  async addToCartWildberries(items: CartItem[]): Promise<boolean> {
    console.log(`Add to Wildberries cart requested for ${items.length} items`);
    return false;
  }

  async addToCartOzon(items: CartItem[]): Promise<boolean> {
    console.log(`Add to Ozon cart requested for ${items.length} items`);
    return false;
  }

  async checkoutWildberries(): Promise<string | null> {
    console.log('Wildberries checkout requested');
    return null;
  }

  async checkoutOzon(): Promise<string | null> {
    console.log('Ozon checkout requested');
    return null;
  }

  async saveCookies(): Promise<any[]> {
    return [];
  }

  async loadCookies(cookies: any[]) {
    console.log('Load cookies requested');
  }
}
