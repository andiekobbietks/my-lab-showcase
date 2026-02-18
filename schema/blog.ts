
export default {
    name: 'blog',
    title: 'Blog Post',
    type: 'document',
    fields: [
        { name: 'title', title: 'Title', type: 'string' },
        {
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: { source: 'title', maxLength: 96 }
        },
        { name: 'publishedAt', title: 'Published at', type: 'datetime' },
        { name: 'coverImage', title: 'main image', type: 'image' },
        {
            name: 'body',
            title: 'Body',
            type: 'array',
            of: [
                { type: 'block' },
                {
                    type: 'image',
                    fields: [
                        { type: 'text', name: 'alt', title: 'Alternative text' }
                    ]
                }
            ]
        }
    ],
}
