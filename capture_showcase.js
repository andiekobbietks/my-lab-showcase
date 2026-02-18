import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, 'docs', 'assets');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

    const capture = async (url, name, waitAfterLoad = 5000) => {
        console.log(`📸 Navigating to ${url}...`);
        try {
            await page.goto(url);
            await page.waitForTimeout(waitAfterLoad);
            await page.screenshot({ path: path.join(outputDir, `${name}.png`) });
            console.log(`✅ ${name}.png saved.`);
        } catch (e) {
            console.error(`❌ Failed to capture ${name}:`, e.message);
        }
    };

    // 1. Admin Panel
    await capture('http://localhost:8080/admin', '01_admin_panel');

    // 2. Recorder Station - Record Tab
    await capture('http://localhost:8080/admin/recorder', '02_recorder_record_tab');

    // 3. Recorder Station - Terminal Tab
    console.log('🖱️ Switching to Terminal tab...');
    try {
        await page.click('button:has-text("Terminal")');
        await page.waitForTimeout(10000); // WebContainer boot
        await page.screenshot({ path: path.join(outputDir, '03_recorder_terminal_tab.png') });
        console.log('✅ 03_recorder_terminal_tab.png saved.');
    } catch (e) {
        console.error('❌ Failed Terminal tab click:', e.message);
    }

    // 4. Admin Labs List
    await capture('http://localhost:8080/admin', '04_admin_labs_list_drafts', 3000);

    await browser.close();
    console.log('🎉 Done!');
})();
