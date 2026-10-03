import { DEFAULT_SUGGESTIONS } from "../../services/financeQuery.service";
import type { QuerySuggestion } from "../../types/financeQuery.types";
import { ArrowUpRight, Sparkles } from "lucide-react";

interface AISuggestionGridProps {
    suggestions?: QuerySuggestion[];
    onSelectSuggestion: (suggestion: QuerySuggestion) => void;
}

export const AISuggestionGrid = ({
    suggestions = DEFAULT_SUGGESTIONS,
    onSelectSuggestion,
}: AISuggestionGridProps) => {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Suggested Explorations
                </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {suggestions.map((sug) => (
                    <button
                        key={sug.id}
                        type="button"
                        onClick={() => onSelectSuggestion(sug)}
                        className="btn-interactive flex items-start justify-between p-3.5 bg-white hover:bg-slate-50 border border-slate-200/80 hover:border-purple-200 rounded-2xl text-left shadow-2xs group cursor-pointer"
                    >
                        <div className="space-y-1 min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                                <span className="text-base" aria-hidden="true">
                                    {sug.icon}
                                </span>
                                <h4 className="text-xs font-bold text-slate-900 group-hover:text-purple-700 transition-colors truncate">
                                    {sug.title}
                                </h4>
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-2">
                                {sug.description}
                            </p>
                        </div>

                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 mt-0.5" />
                    </button>
                ))}
            </div>
        </div>
    );
};

export default AISuggestionGrid;
