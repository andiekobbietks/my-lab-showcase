import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, 'screenshots');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const page = await context.newPage();

    console.log('📸 Navigating to Recorder page...');
    await page.goto('http://localhost:8080/admin/recorder', { waitUntil: 'networkidle' });

    // Click Terminal tab
    console.log('🖱️ Clicking Terminal tab...');
    await page.click('button:has-text("Terminal")');

    // Wait for WebContainer to boot (usually ~5s)
    console.log('⏳ Waiting for WebContainer boot...');
    await page.waitForTimeout(10000);

    await page.screenshot({ path: path.join(outputDir, 'recorder_terminal_tab.png') });
    console.log('✅ recorder_terminal_tab.png');

    await browser.close();
    console.log('🎉 Done!');
})();
