import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, 'docs', 'assets');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const page = await context.newPage();

    const capture = async (name, wait = 2000) => {
        console.log(`📸 Capturing ${name}...`);
        await page.waitForTimeout(wait);
        await page.screenshot({ path: path.join(outputDir, `${name}.png`) });
        console.log(`✅ ${name}.png`);
    };

    // 1. Admin Panel
    console.log('🚶 Navigating to Admin...');
    await page.goto('http://localhost:8080/admin', { waitUntil: 'networkidle' });
    await capture('01_admin_panel');

    // 2. Recorder Station - Record Tab
    console.log('🚶 Navigating to Recorder...');
    await page.goto('http://localhost:8080/admin/recorder', { waitUntil: 'networkidle' });
    await capture('02_recorder_record_tab');

    // 3. Recorder Station - Terminal Tab
    console.log('🖱️ Clicking Terminal tab...');
    await page.click('button:has-text("Terminal")');
    await capture('03_recorder_terminal_tab', 10000); // Give WebContainer time to boot

    // 4. Recorder Station - Import Tab
    console.log('🖱️ Clicking Import tab...');
    await page.click('button:has-text("Import")');
    await capture('04_recorder_import_tab');

    // 5. Recorder Station - Preview Tab (empty)
    console.log('🖱️ Clicking Preview tab...');
    await page.click('button:has-text("Preview")');
    await capture('05_recorder_preview_tab');

    await browser.close();
    console.log('🎉 Showcase capture complete!');
})();
