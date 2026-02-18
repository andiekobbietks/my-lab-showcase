
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const sampleLab = {
    id: 'demo-lab-1',
    title: 'Automated Network Defense',
    description: 'A simulation of defending against a DDoS attack using reactive SDN rules.',
    tags: ['Security', 'SDN', 'Automation'],
    objective: 'Mitigate traffic spikes in real-time.',
    environment: 'Mininet + OpenDaylight',
    steps: ['Detect anomaly', 'Push flow rule', 'Verify mitigation'],
    outcome: 'Traffic dropped by 99%.',
    createdAt: new Date().toISOString()
};

(async () => {
    const browser = await chromium.launch();
    // Create context with video recording enabled
    const context = await browser.newContext({
        recordVideo: {
            dir: 'videos/',
            size: { width: 1280, height: 720 }
        },
        viewport: { width: 1280, height: 720 }
    });

    const page = await context.newPage();
    const baseUrl = 'http://localhost:8080';

    console.log('Starting video recording...');

    try {
        // 1. Seed Data manually into localStorage
        await page.goto(baseUrl);
        await page.evaluate((lab) => {
            const existing = JSON.parse(localStorage.getItem('portfolio_labs') || '[]');
            if (!existing.some(l => l.id === lab.id)) {
                existing.push(lab);
                localStorage.setItem('portfolio_labs', JSON.stringify(existing));
            }
        }, sampleLab);
        console.log('Seeded sample data.');

        // 2. Reload to see data
        await page.reload({ waitUntil: 'networkidle' });

        // 3. User Journey: Homepage
        console.log('Exploring Homepage...');
        await page.waitForTimeout(1000); // Pause for viewer

        // Smooth scroll to Labs
        const labsSection = page.locator('#labs');
        await labsSection.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1500);


        // 4. User Journey: Open Lab Details
        console.log('Opening Lab Details...');
        try {
            const labCard = page.locator('#labs .grid > .rounded-xl').first();
            if (await labCard.isVisible({ timeout: 5000 })) {
                await labCard.click();
                await page.waitForTimeout(2000);
                await page.keyboard.press('Escape');
                await page.waitForTimeout(500);
            } else {
                console.log('Lab card not visible, skipping detail view.');
            }
        } catch (e) {
            console.log('Skipping lab details due to error:', e.message);
        }

        // 5. User Journey: Admin
        console.log('Navigating to Admin...');
        await page.goto(`${baseUrl}/admin`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Interact with form
        await page.getByLabel('Name').fill('Alex Engineering');
        await page.waitForTimeout(500);
        await page.getByLabel('Title').fill('Full Stack SDDC Architect');
        await page.waitForTimeout(1000);

        console.log('Walkthrough complete.');

    } catch (error) {
        console.error('Error during recording:', error);
    } finally {
        // Closing the context saves the video
        await context.close();
        await browser.close();

        // Rename the video file (it has a random name by default)
        const videoDir = path.join(process.cwd(), 'videos');
        const files = fs.readdirSync(videoDir);
        // Assuming the specific file we just made is the latest or only one
        // Playwright uses random names like '34324234.webm'
        const latestVideo = files.find(f => f.endsWith('.webm'));
        if (latestVideo) {
            const oldPath = path.join(videoDir, latestVideo);
            const newPath = path.join(videoDir, 'app_walkthrough.webm');
            fs.renameSync(oldPath, newPath);
            console.log(`Video saved to: ${newPath}`);
        }
    }
})();
