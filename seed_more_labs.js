
import { chromium } from 'playwright';

const newLabs = [
    {
        id: 'vmware-hol',
        title: 'VMware Hands-on Lab Integration',
        description: 'A dedicated environment mirroring the VMware HOL Odyssey challenges.',
        tags: ['VMware', 'Virtualisation', 'vSphere'],
        objective: 'Complete the HOL-2201-01-SDDC challenge within 30 minutes.',
        environment: 'vSphere 8.0, NSX-T 3.2',
        steps: ['Deploy vCenter', 'Configure vSAN', 'Migrate workloads'],
        outcome: 'Successfully replicated the HOL scenario locally.',
        repoUrl: 'https://www.vmware.com/resources/hands-on-labs',
        createdAt: new Date().toISOString()
    },
    {
        id: 'einstein-agogo',
        title: 'Einstein A Go-Go Radio Archive',
        description: 'An AI-powered archive interface for the long-running science radio show.',
        tags: ['AI', 'Archive', 'Science'],
        objective: 'Index and search through decades of audio content.',
        environment: 'Python, Whisper AI, React',
        steps: ['Scrape audio files', 'Transcribe with Whisper', 'Build search UI'],
        outcome: 'Created a searchable database of scientific discussions.',
        repoUrl: 'https://www.youtube.com/@einsteinagogo',
        createdAt: new Date().toISOString()
    }
];

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const baseUrl = 'http://localhost:8080';

    console.log('Seeding new labs...');
    await page.goto(baseUrl);

    await page.evaluate((labs) => {
        const existing = JSON.parse(localStorage.getItem('portfolio_labs') || '[]');
        labs.forEach(lab => {
            if (!existing.some(l => l.id === lab.id)) {
                existing.push(lab);
            }
        });
        localStorage.setItem('portfolio_labs', JSON.stringify(existing));
    }, newLabs);

    console.log('Done! Refresh your portfolio to see them.');
    await browser.close();
})();
