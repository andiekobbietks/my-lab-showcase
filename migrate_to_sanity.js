
const { createClient } = require('@sanity/client');

// --- CONFIGURATION ---
const client = createClient({
    projectId: process.env.VITE_SANITY_PROJECT_ID,
    dataset: process.env.VITE_SANITY_DATASET || 'production',
    token: process.env.SANITY_MIGRATION_TOKEN, // Needs a token with write access
    useCdn: false,
    apiVersion: '2024-03-20',
});

// --- DATA TO MIGRATE (Mocking what is in localStorage) ---
const labsToMigrate = [
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

async function migrate() {
    if (!client.config().token) {
        console.error('Error: SANITY_MIGRATION_TOKEN not found in environment.');
        process.exit(1);
    }

    console.log('Starting migration...');

    for (const lab of labsToMigrate) {
        const doc = {
            _type: 'lab',
            _id: lab.id, // Keep the same ID if possible, or let Sanity generate one
            title: lab.title,
            slug: { _type: 'slug', current: lab.id },
            description: lab.description,
            tags: lab.tags,
            objective: lab.objective,
            environment: lab.environment,
            steps: lab.steps,
            outcome: lab.outcome,
            repoUrl: lab.repoUrl,
            createdAt: lab.createdAt,
            // Map other fields as needed
        };

        try {
            await client.createOrReplace(doc);
            console.log(`Migrated: ${lab.title}`);
        } catch (err) {
            console.error(`Failed to migrate ${lab.title}:`, err.message);
        }
    }

    console.log('Migration complete!');
}

migrate();
