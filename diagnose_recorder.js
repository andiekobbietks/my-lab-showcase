import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('http://localhost:8080/admin/recorder', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(5000);

    const bodyHTML = await page.evaluate(() => document.body.innerHTML.substring(0, 500));
    console.log('Body HTML:', bodyHTML);
    console.log('Errors:', errors);

    await browser.close();
})();
