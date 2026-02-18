
import { chromium } from 'playwright';
import path from 'path';

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    const baseUrl = 'http://localhost:8080';
    const outputDir = process.cwd();

    console.log(`Navigating to ${baseUrl}...`);
    try {

        // 1. Homepage & Hero
        await page.goto(baseUrl, { waitUntil: 'networkidle' });

        // Hero Section: Target the specific class from HeroSection.tsx
        // The hero has "min-h-screen", "flex", "items-center"
        // avoiding the invisible toast/notification sections
        const hero = page.locator('section.min-h-screen').first();
        await hero.waitFor({ state: 'visible', timeout: 10000 });
        await hero.screenshot({ path: path.join(outputDir, 'hero_section.png') });
        console.log('Saved hero_section.png');


        // Scroll to and Wait for Lab Card
        try {
            // Try a broader selector and wait longer
            const labCard = page.locator('#labs .grid > .rounded-xl').first();
            // .rounded-xl is the class on the Card component
            await labCard.scrollIntoViewIfNeeded();
            await labCard.waitFor({ state: 'visible', timeout: 15000 });
            await labCard.screenshot({ path: path.join(outputDir, 'lab_card_example.png') });
            console.log('Saved lab_card_example.png');
        } catch (e) {
            console.error('Could not capture lab card:', e.message);
        }

        // 2. Admin Interface
        await page.goto(`${baseUrl}/admin`, { waitUntil: 'networkidle' });

        // Admin Dashboard (Top area)
        await page.locator('.container > div.flex.items-center.justify-between.mb-8').screenshot({ path: path.join(outputDir, 'admin_header.png') });
        console.log('Saved admin_header.png');

        // Lab Editor Form (Click Add Lab to see it)
        await page.getByRole('tab', { name: 'Labs' }).click();
        await page.getByRole('button', { name: 'Add Lab' }).click();

        // Capture the Card containing the form
        await page.locator('.space-y-6 > .rounded-xl').first().screenshot({ path: path.join(outputDir, 'lab_editor_form.png') });
        console.log('Saved lab_editor_form.png');

    } catch (error) {
        console.error('Error capturing screenshots:', error);
    } finally {
        await browser.close();
    }
})();
