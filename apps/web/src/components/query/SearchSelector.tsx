interface SearchSelectorProps {
    searchTerm: string;
    onSearchChange: (search: string) => void;
}

const SearchSelector = ({ searchTerm, onSearchChange }: SearchSelectorProps) => {
    return (
        <div className="space-y-1.5">
            <label htmlFor="query-search-input" className="block text-xs font-semibold text-slate-700">
                Optional: Filter by Title or Note Keyword
            </label>
            <div className="relative">
                <input
                    id="query-search-input"
                    type="text"
                    placeholder="e.g. Starbucks, Amazon, Uber, groceries..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                />
                {searchTerm && (
                    <button
                        type="button"
                        onClick={() => onSearchChange("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                        aria-label="Clear search text"
                    >
                        ✕
                    </button>
                )}
            </div>
        </div>
    );
};

export default SearchSelector;
