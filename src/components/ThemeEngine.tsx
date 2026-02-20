import { useEffect } from 'react';
import { api } from '../../convex/_generated/api';
import { defaultTheme } from '@/lib/data';
import { useSafeQuery } from '@/hooks/use-safe-query';

export const ThemeEngine = () => {
    const customTheme = useSafeQuery(api.queries.getTheme);

    useEffect(() => {
        const theme = customTheme || defaultTheme;
        const root = document.documentElement;

        // Apply HSL colors
        root.style.setProperty('--primary', theme.primaryColor);
        root.style.setProperty('--secondary', theme.secondaryColor);
        root.style.setProperty('--accent', theme.accentColor);
        root.style.setProperty('--background', theme.backgroundColor);

        // Apply Radius and Fonts
        root.style.setProperty('--radius', theme.radius);
        root.style.setProperty('--font-sans', theme.fontSans);
        root.style.setProperty('--font-serif', theme.fontSerif);

        // Toggle Dark Class
        if (theme.isDark) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [customTheme]);

    return null; // Side-effect only component
};
