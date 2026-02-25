/**
 * ============================================================================
 * END-TO-END AI AGENT TEST SCRIPT
 * Prediction Market Platform — Full Lifecycle Test
 * ============================================================================
 */

import { test, expect, Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// ─── Load Environment Variables ───────────────────────────────────────────────
const ENV = {
    BASE_URL: process.env.BASE_URL || 'https://polymarket-bangladesh.vercel.app',
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || '',
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || '',
    TEST_USER_EMAIL: process.env.TEST_USER_EMAIL || `testuser_${Date.now()}@test.com`,
    TEST_USER_PASSWORD: process.env.TEST_USER_PASSWORD || 'TestPass_Auto!9',
    TEST_USER_NAME: process.env.TEST_USER_NAME || `AutoUser_${Date.now()}`,
    FREE_CREDIT_AMOUNT: Number(process.env.FREE_CREDIT_AMOUNT || 100),
    TRADE_AMOUNT: Number(process.env.TRADE_AMOUNT || 10),
    SUPABASE_URL: process.env.SUPABASE_URL || '',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
};

// Secure admin path as identified in middleware.ts
const SECURE_PATHS = {
    admin: '/sys-cmd-7x9k2',
    auth: '/auth-portal-3m5n8',
};

// ─── Test Data — Generated Fresh Each Run ─────────────────────────────────────
const RUN_ID = Date.now();
const EVENT_DATA = {
    title: `[AUTO-TEST] BTC to $100k? — ${RUN_ID}`,
    question: `Will BTC reach $100k by ${Date.now()}?`,
    description: `Automated test event created by e2e test suite. Run ID: ${RUN_ID}.`,
    category: 'technology',
    resolutionDate: getFutureDateString(7),
    yesLabel: 'হ্যাঁ (YES)',
    noLabel: 'না (NO)',
};

const STATE = {
    eventId: '',
    eventSlug: '',
    userBalanceBefore: 0,
    userBalanceAfter: 0,
    tradeSide: 'YES' as 'YES' | 'NO',
    resolveAs: 'YES' as 'YES' | 'NO',
};

const supabaseAdmin = ENV.SUPABASE_URL && ENV.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY)
    : null;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getFutureDateString(daysFromNow: number): string {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    return d.toISOString().split('T')[0];
}

async function waitForPageReady(page: Page): Promise<void> {
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
}

async function takeDebugScreenshot(page: Page, label: string): Promise<void> {
    await page.screenshot({
        path: `./test-screenshots/${RUN_ID}_${label.replace(/\s+/g, '-')}.png`,
        fullPage: true,
    });
}

async function loginAsAdmin(page: Page): Promise<void> {
    await page.goto(`${ENV.BASE_URL}${SECURE_PATHS.auth}`);
    await waitForPageReady(page);

    await page.locator('#email').fill(ENV.ADMIN_EMAIL);
    await page.locator('#password').fill(ENV.ADMIN_PASSWORD);
    await page.locator('#security-check').check();

    await page.locator('button:has-text("Authenticate")').click();

    // Wait for redirect to admin dashboard
    await page.waitForURL((url) => url.pathname.includes(SECURE_PATHS.admin), { timeout: 20_000 });
    await waitForPageReady(page);
    console.log(`✅ Logged in as Admin: ${ENV.ADMIN_EMAIL}`);
}

async function loginAsUser(page: Page, email: string, pass: string): Promise<void> {
    await page.goto(`${ENV.BASE_URL}/login`);
    await waitForPageReady(page);

    await page.locator('input[name="email"], #email').fill(email);
    await page.locator('input[name="password"], #password').fill(pass);
    await page.locator('button[type="submit"], button:has-text("Sign in")').click();

    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20_000 });
    await waitForPageReady(page);
    console.log(`✅ Logged in as User: ${email}`);
}

async function getCurrentBalance(page: Page): Promise<number> {
    await page.goto(`${ENV.BASE_URL}/wallet`);
    await waitForPageReady(page);

    const balanceEl = page.locator('[data-testid="user-balance"], .user-balance, [class*="balance"]').first();
    const text = await balanceEl.textContent();
    const numeric = parseFloat((text || '0').replace(/[^0-9.]/g, ''));
    return isNaN(numeric) ? 0 : numeric;
}

// ============================================================================
// TEST SUITE
// ============================================================================

test.describe('Full Platform Lifecycle — Event Create → Trade → Resolve', () => {

    test.setTimeout(300_000);

    test.beforeAll(async () => {
        const { mkdirSync } = await import('fs');
        mkdirSync('./test-screenshots', { recursive: true });
        console.log(`\n🚀 Starting E2E Test Run ID: ${RUN_ID}`);
    });

    test('Step 1 & 2: Admin creates a new prediction market event', async ({ page }) => {
        await loginAsAdmin(page);

        await page.goto(`${ENV.BASE_URL}${SECURE_PATHS.admin}/events/create`);
        await waitForPageReady(page);

        // The page shows "Advanced Control Panel" by default or is selected
        // Let's ensure Core Definition is expanded
        const coreHeader = page.locator('h3:has-text("Core Definition"), div:has-text("Core Definition")').first();
        await coreHeader.scrollIntoViewIfNeeded();
        await coreHeader.click({ force: true });

        // Wait for expansion animation
        await page.waitForTimeout(1000);

        await page.locator('input#name').fill(EVENT_DATA.title);
        await page.locator('textarea#question').fill(EVENT_DATA.description);

        // Select category (Radix Select)
        const categoryTrigger = page.locator('button[role="combobox"]:has-text("Sports"), button[role="combobox"]:has-text("Select Category")').first();
        await categoryTrigger.scrollIntoViewIfNeeded();
        await categoryTrigger.click({ force: true });
        await page.locator('[role="option"]:has-text("Technology")').click();

        // Temporal Settings
        const temporalHeader = page.locator('h3:has-text("Temporal & Financial Parameters"), div:has-text("Temporal & Financial Parameters")').first();
        await temporalHeader.scrollIntoViewIfNeeded();
        await temporalHeader.click({ force: true });

        // Wait for expansion animation
        await page.waitForTimeout(1000);

        const endsAtInput = page.locator('input#endsAt');
        await endsAtInput.scrollIntoViewIfNeeded();
        await endsAtInput.fill(`${EVENT_DATA.resolutionDate}T23:59`, { force: true });

        await takeDebugScreenshot(page, 'step2-form-filled');

        await page.locator('button:has-text("Deploy Market")').click();

        // Handle alert if it appears
        page.on('dialog', dialog => dialog.accept());

        // Wait for success indicator or redirect
        await expect(page.locator('text="Market created successfully!"')).toBeVisible({ timeout: 30_000 });

        // Extact ID from audit logs or URL if redirected. 
        // For now, assume it stays on page or we can find it in markets list
        await page.goto(`${ENV.BASE_URL}${SECURE_PATHS.admin}/markets`);
        await waitForPageReady(page);

        const eventLink = page.locator(`text="${EVENT_DATA.title}"`).first();
        await eventLink.click();
        await waitForPageReady(page);

        const currentUrl = page.url();
        const urlParts = currentUrl.split('/').filter(Boolean);
        STATE.eventSlug = urlParts[urlParts.length - 1];
        STATE.eventId = STATE.eventSlug;

        console.log(`   Created event slug: ${STATE.eventSlug}`);
    });

    test('Step 4: New test user registers an account', async ({ page }) => {
        await page.goto(`${ENV.BASE_URL}/register`);
        await waitForPageReady(page);

        await page.locator('input[name="name"]').fill(ENV.TEST_USER_NAME);
        await page.locator('input[name="email"]').fill(ENV.TEST_USER_EMAIL);
        // There are multiple password fields, use nth(0) for password and nth(1) for confirm or name
        await page.locator('input[type="password"]').nth(0).fill(ENV.TEST_USER_PASSWORD);
        await page.locator('input[name="confirmPassword"], input[type="password"]').nth(1).fill(ENV.TEST_USER_PASSWORD);

        // Checkbox might be hidden input + label
        await page.locator('label:has-text("I agree"), input[type="checkbox"]').first().click();

        await page.locator('button[type="submit"]').click();

        await page.waitForURL((url) => !url.pathname.includes('/register'), { timeout: 30_000 });

        // Auto-confirm and add balance via Supabase Admin (Direct DB)
        if (supabaseAdmin) {
            const { data: users } = await supabaseAdmin.auth.admin.listUsers();
            const testUser = users?.users?.find(u => u.email === ENV.TEST_USER_EMAIL);
            if (testUser) {
                await supabaseAdmin.auth.admin.updateUserById(testUser.id, { email_confirm: true });
                // Create wallet if it doesn't exist
                await supabaseAdmin.from('wallets').upsert({ user_id: testUser.id, balance: ENV.FREE_CREDIT_AMOUNT });
                console.log('   User auto-setup complete via Supabase Admin');
            }
        }
    });

    test('Step 6: User places a trade', async ({ page }) => {
        await loginAsUser(page, ENV.TEST_USER_EMAIL, ENV.TEST_USER_PASSWORD);

        await page.goto(`${ENV.BASE_URL}/markets/${STATE.eventSlug}`);
        await waitForPageReady(page);

        STATE.userBalanceBefore = await getCurrentBalance(page);
        await page.goto(`${ENV.BASE_URL}/markets/${STATE.eventSlug}`);

        // Place trade - check for YES/NO buttons
        const yesButton = page.locator('button:has-text("YES"), button:has-text("হ্যাঁ")').first();
        await yesButton.click();

        await page.locator('input[type="number"], input[placeholder*="Amount"]').fill(String(ENV.TRADE_AMOUNT));
        await page.locator('button:has-text("Buy"), button:has-text("Place Trade"), button:has-text("Confirm")').click();

        await expect(page.locator('text="Trade successful", text="Trade placed", text="success"').first()).toBeVisible({ timeout: 20_000 });
    });

    test('Step 7: Admin resolves the event', async ({ page }) => {
        await loginAsAdmin(page);

        // Navigate to admin management for the market
        await page.goto(`${ENV.BASE_URL}${SECURE_PATHS.admin}/markets/${STATE.eventSlug}`);
        await waitForPageReady(page);

        await page.locator('button:has-text("Resolve")').click();
        await page.locator('button:has-text("YES")').click();
        await page.locator('button:has-text("Confirm Resolution")').click();

        await expect(page.locator('text="Resolved"').first()).toBeVisible({ timeout: 15_000 });
    });

    test('Step 8: Verify balance update', async ({ page }) => {
        await loginAsUser(page, ENV.TEST_USER_EMAIL, ENV.TEST_USER_PASSWORD);

        // Payout might take a moment
        await page.waitForTimeout(5000);

        STATE.userBalanceAfter = await getCurrentBalance(page);
        console.log(`   Balance Before: ${STATE.userBalanceBefore}`);
        console.log(`   Balance After: ${STATE.userBalanceAfter}`);

        expect(STATE.userBalanceAfter).toBeGreaterThan(STATE.userBalanceBefore - ENV.TRADE_AMOUNT);
    });

    test.afterAll(async () => {
        if (supabaseAdmin) {
            console.log('🧹 Cleaning up test data...');
            await supabaseAdmin.from('markets').delete().ilike('title', `%${RUN_ID}%`);
            const { data: users } = await supabaseAdmin.auth.admin.listUsers();
            const testUser = users?.users?.find(u => u.email === ENV.TEST_USER_EMAIL);
            if (testUser) {
                await supabaseAdmin.auth.admin.deleteUser(testUser.id);
            }
        }
    });
});
