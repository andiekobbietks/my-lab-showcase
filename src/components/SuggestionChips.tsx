import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2 } from 'lucide-react';
import { getAISuggestions } from '@/lib/foundry-local';

interface SuggestionChipsProps {
    field: string;
    value: string;
    context?: string;
    onSelect: (val: string) => void;
}

export const SuggestionChips = ({ field, value, context, onSelect }: SuggestionChipsProps) => {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchSuggestions = useCallback(async (currentVal: string) => {
        if (currentVal.length < 3) {
            setSuggestions([]);
            return;
        }

        setLoading(true);
        const results = await getAISuggestions(field, currentVal, context);
        setSuggestions(results);
        setLoading(false);
    }, [field, context]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchSuggestions(value);
        }, 800);
        return () => clearTimeout(timer);
    }, [value, fetchSuggestions]);

    if (!loading && suggestions.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-300">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mr-1">
                <Sparkles className="h-2.5 w-2.5" />
                AI Suggestions
            </div>
            {loading ? (
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground self-center" />
            ) : (
                suggestions.map((s, i) => (
                    <Badge
                        key={i}
                        variant="secondary"
                        className="cursor-pointer hover:bg-secondary/80 text-[11px] py-0 px-2 h-5 font-normal"
                        onClick={() => onSelect(s)}
                    >
                        {s}
                    </Badge>
                ))
            )}
        </div>
    );
};
