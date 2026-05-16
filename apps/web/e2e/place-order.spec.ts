import { test, expect } from '@playwright/test';

test.describe('Place Order E2E', () => {
  test.beforeEach(async ({ page }) => {
    const loginResp = await page.request.post('/api/auth/login', {
      data: { email: 'test@plokymarket.com', password: 'TestPass123!' },
    });
    expect(loginResp.ok()).toBeTruthy();
  });

  test('user can place a limit order', async ({ page }) => {
    await page.goto('/markets');
    await page.waitForSelector('[data-testid="market-card"]', { timeout: 10000 });
    await page.click('[data-testid="market-card"] >> nth=0');
    await page.waitForURL(/\/markets\/.+/);
    await page.click('[data-testid="outcome-yes"]');
    await page.fill('[data-testid="order-quantity"]', '100');
    await page.fill('[data-testid="order-price"]', '0.55');
    await page.click('[data-testid="place-order-btn"]');
    await expect(page.locator('[data-testid="order-success"]')).toBeVisible({ timeout: 10000 });
  });
});
