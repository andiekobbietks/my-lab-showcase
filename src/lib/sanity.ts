
import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

export const client = createClient({
    projectId: process.env.VITE_SANITY_PROJECT_ID || 'your-project-id',
    dataset: process.env.VITE_SANITY_DATASET || 'production',
    useCdn: true, // set to `false` to bypass the edge cache
    apiVersion: '2024-03-20',
});

const builder = imageUrlBuilder(client);

export function urlFor(source: any) {
    return builder.image(source);
}
