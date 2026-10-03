import { Sparkles } from "lucide-react";

interface ExploreButtonProps {
    onClick: () => void;
    className?: string;
}

export const ExploreButton = ({
    onClick,
    className = "",
}: ExploreButtonProps) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`btn-interactive inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-purple-900 bg-gradient-to-r from-purple-100 via-indigo-100 to-purple-100 hover:from-purple-200 hover:to-indigo-200 border border-purple-200/80 rounded-xl shadow-xs transition-all cursor-pointer ${className}`}
            aria-label="Explore your money"
        >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>✦ Explore</span>
        </button>
    );
};

export const FinanceAIButton = ExploreButton;
export default ExploreButton;
