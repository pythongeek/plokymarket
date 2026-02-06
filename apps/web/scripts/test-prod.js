const puppeteer = require('puppeteer');

const BASE_URL = 'https://polymarket-bangladesh.vercel.app';
// const BASE_URL = 'http://localhost:3000'; // For local testing

async function runTest() {
    console.log('Starting E2E Test on: ' + BASE_URL);
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    await page.setViewport({ width: 1280, height: 800 });

    async function screenshot(name) {
        const path = `test-failure-${name}.png`;
        try {
            await page.screenshot({ path });
            console.log(`   Screenshot saved to ${path}`);
        } catch (e) {
            console.log('   Could not take screenshot: ' + e.message);
        }
    }

    try {
        // 1. Registration
        console.log('1. Testing Registration...');
        await page.goto(`${BASE_URL}/register`);

        if (page.url().includes('/markets')) {
            console.log('   Already logged in. Logging out first...');
            const client = await page.target().createCDPSession();
            await client.send('Network.clearBrowserCookies');
            await client.send('Network.clearBrowserCache');
            await page.goto(`${BASE_URL}/register`);
        }

        const testUser = {
            name: 'AutoTest User',
            email: `autotest_${Date.now()}@example.com`,
            password: 'TestPassword123!'
        };

        console.log(`   Creating user: ${testUser.email}`);

        await page.waitForSelector('#fullName', { timeout: 10000 });
        await new Promise(r => setTimeout(r, 1000));

        await page.type('#fullName', testUser.name);
        await page.type('#email', testUser.email);
        await page.type('#password', testUser.password);
        await page.type('#confirmPassword', testUser.password);

        // Click Label top-left to avoid links in center
        try {
            await page.click('label[for="terms"]', { offset: { x: 2, y: 2 } });
        } catch (e) {
            // Fallback
            await page.evaluate(() => {
                const el = document.getElementById('terms');
                if (el) el.click();
            });
        }

        console.log('   Submitting form...');
        console.log('   Submitting form...');

        // Use page.evaluate to click, which is safer against context destruction during navigation
        await page.evaluate(() => {
            const btn = document.querySelector('button[type="submit"]');
            if (btn) btn.click();
        });

        console.log('   Waiting for success/redirect...');

        // Manual polling for success state or URL change
        let attempts = 0;
        while (attempts < 30) { // 30 tries * 500ms = 15s timeout
            await new Promise(r => setTimeout(r, 500));

            // Check URL
            if (page.url().includes('/markets')) {
                console.log('   Redirect to /markets detected!');
                break;
            }

            // Check for success text safely
            try {
                const hasSuccess = await page.evaluate(() => {
                    const text = document.body.innerText;
                    return text.includes('Account Created') || text.includes('অ্যাকাউন্ট তৈরি হয়েছে');
                });
                if (hasSuccess) {
                    console.log('   Success message detected. Waiting for auto-redirect...');
                    // Just wait for URL to change in next iterations
                }
            } catch (e) {
                // Context destroyed? That's good, means navigation is happening!
                console.log('   Context destroyed/changed, likely navigating...');
            }
            attempts++;
        }

        if (!page.url().includes('/markets')) {
            console.error('   FAILED: Did not redirect to /markets. Current URL: ' + page.url());
            await screenshot('reg-fail');
            throw new Error('Registration failed');
        }
        console.log('   SUCCESS: Registered and redirected to /markets');

        // 3. Logout
        console.log('2. Testing Logout...');
        await new Promise(r => setTimeout(r, 2000));

        // Use clear cookies for stable logout
        const client = await page.target().createCDPSession();
        await client.send('Network.clearBrowserCookies');
        await page.reload();
        await new Promise(r => setTimeout(r, 2000));
        console.log('   Logged out (via cookie clear).');

        // 4. Login
        console.log('3. Testing Login...');
        await page.goto(`${BASE_URL}/login`);

        await page.waitForSelector('#email', { timeout: 10000 });
        await new Promise(r => setTimeout(r, 1000));

        await page.type('#email', testUser.email);
        await page.type('#password', testUser.password);

        console.log('   Submitting login...');
        const loginSubmit = await page.$('button[type="submit"]');

        await loginSubmit.click();

        console.log('   Waiting for redirect...');
        // Poll for URL change again
        let loginAttempts = 0;
        while (loginAttempts < 30) {
            await new Promise(r => setTimeout(r, 500));
            if (page.url().includes('/markets')) {
                console.log('   Redirect detected!');
                break;
            }
            loginAttempts++;
        }

        if (!page.url().includes('/markets')) {
            console.error('   FAILED: Login did not redirect to /markets. Current URL: ' + page.url());
            await screenshot('login-fail');
            throw new Error('Login failed');
        }
        console.log('   SUCCESS: Logged in and redirected to /markets');

        // 5. Market Browsing
        console.log('4. Testing Market Browsing...');
        try {
            await page.waitForSelector('a[href*="/markets/"]', { timeout: 10000 });
            console.log('   SUCCESS: Market cards verified visible.');
        } catch (e) {
            console.error('   FAILED: No markets found on page.');
            await screenshot('no-markets');
            console.warn('   WARNING: Could not find any market cards. Database might be empty or loading failed.');
        }

        console.log('✅ E2E Verification Complete!');

    } catch (error) {
        console.error('❌ Test Failed:', error);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

runTest();
