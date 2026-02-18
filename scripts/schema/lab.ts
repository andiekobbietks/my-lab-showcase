
export default {
    name: 'lab',
    title: 'Lab Project',
    type: 'document',
    fields: [
        { name: 'title', title: 'Title', type: 'string' },
        {
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: { source: 'title', maxLength: 96 }
        },
        { name: 'description', title: 'Short Description', type: 'text', rows: 3 },
        {
            name: 'tags',
            title: 'Tags',
            type: 'array',
            of: [{ type: 'string' }],
        },
        { name: 'objective', title: 'Objective', type: 'text' },
        { name: 'environment', title: 'Environment', type: 'text' },
        {
            name: 'steps',
            title: 'Process Steps',
            type: 'array',
            of: [{ type: 'string' }]
        },
        { name: 'outcome', title: 'Outcome', type: 'text' },
        { name: 'repoUrl', title: 'Repository URL', type: 'url' },

        // Rich Media
        {
            name: 'thumbnail',
            title: 'Thumbnail',
            type: 'image',
            options: { hotspot: true },
        },
        {
            name: 'media',
            title: 'Gallery Media',
            type: 'array',
            of: [
                {
                    type: 'image',
                    options: { hotspot: true },
                    fields: [
                        { name: 'caption', title: 'Caption', type: 'string' },
                        {
                            name: 'mediaType',
                            title: 'Type',
                            type: 'string',
                            options: { list: ['image', 'gif', 'video'] },
                            initialValue: 'image'
                        },
                        { name: 'videoUrl', title: 'Video URL (if video)', type: 'url' },
                        { name: 'narration', title: 'AI Narration', type: 'text' },
                    ]
                }
            ]
        },

        // AI Metadata
        { name: 'aiNarration', title: 'Overall AI Summary', type: 'text' },
        {
            name: 'narrationSource',
            title: 'Narration Source',
            type: 'string',
            options: { list: ['foundry', 'cloud', 'text'] }
        },
        { name: 'createdAt', title: 'Created At', type: 'datetime', initialValue: () => new Date().toISOString() },
    ],
}
