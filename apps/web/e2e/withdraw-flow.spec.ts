import { test, expect } from '@playwright/test';

test.describe('Withdrawal Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    const loginResp = await page.request.post('/api/auth/login', {
      data: { email: 'test@plokymarket.com', password: 'TestPass123!' },
    });
    expect(loginResp.ok()).toBeTruthy();
  });

  test('user can request a withdrawal', async ({ page }) => {
    await page.goto('/wallet');
    await page.waitForSelector('[data-testid="wallet-balance"]', { timeout: 10000 });
    await page.click('[data-testid="withdraw-tab"]');
    await page.fill('[data-testid="withdraw-amount"]', '50');
    await page.fill('[data-testid="withdraw-address"]', '0x1234567890123456789012345678901234567890');
    await page.selectOption('[data-testid="withdraw-network"]', 'bep20');
    await page.click('[data-testid="submit-withdrawal"]');
    await expect(page.locator('[data-testid="withdrawal-pending"]')).toBeVisible({ timeout: 10000 });
  });
});
