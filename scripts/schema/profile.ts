
export default {
    name: 'profile',
    title: 'Profile',
    type: 'document',
    fields: [
        { name: 'name', title: 'Name', type: 'string' },
        { name: 'title', title: 'Title', type: 'string' },
        { name: 'tagline', title: 'Tagline', type: 'string' },
        { name: 'bio', title: 'Bio', type: 'text' },
        { name: 'githubUsername', title: 'GitHub Username', type: 'string' },
        { name: 'linkedinUrl', title: 'LinkedIn URL', type: 'url' },
        { name: 'email', title: 'Email', type: 'string' },
        {
            name: 'skills',
            title: 'Skills',
            type: 'array',
            of: [
                {
                    type: 'object',
                    fields: [
                        { name: 'name', title: 'Name', type: 'string' },
                        { name: 'level', title: 'Level (0-100)', type: 'number' },
                        {
                            name: 'category',
                            title: 'Category',
                            type: 'string',
                            options: {
                                list: [
                                    { title: 'Virtualisation', value: 'Virtualisation' },
                                    { title: 'Networking', value: 'Networking' },
                                    { title: 'Cloud', value: 'Cloud' },
                                    { title: 'Systems', value: 'Systems' },
                                    { title: 'Automation', value: 'Automation' },
                                ],
                            }
                        },
                    ]
                }
            ]
        },
        {
            name: 'certifications',
            title: 'Certifications',
            type: 'array',
            of: [
                {
                    type: 'object',
                    fields: [
                        { name: 'name', title: 'Name', type: 'string' },
                        { name: 'issuer', title: 'Issuer', type: 'string' },
                        { name: 'year', title: 'Year', type: 'string' },
                    ]
                }
            ]
        },
        { name: 'cvUrl', title: 'CV URL', type: 'url' },
    ],
}
