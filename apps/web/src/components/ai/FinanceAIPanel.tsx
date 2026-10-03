import { useEffect, useState } from "react";
import { Sparkles, X, Maximize2, Minimize2 } from "lucide-react";
import { QueryBuilder } from "./QueryBuilder";

interface QueryExplorerPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export const QueryExplorerPanel = ({ isOpen, onClose }: QueryExplorerPanelProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Close on Escape key press
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    // Prevent body scroll when open on mobile
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-60 overflow-hidden" role="dialog" aria-modal="true">
            {/* Backdrop Blur Overlay */}
            <div
                onClick={onClose}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
                aria-hidden="true"
            />

            {/* Drawer Container */}
            <div className="fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10">
                <div
                    className={`w-screen bg-white shadow-2xl flex flex-col transition-all duration-300 ease-in-out ${
                        isExpanded
                            ? "sm:max-w-4xl"
                            : "sm:max-w-xl md:max-w-2xl"
                    }`}
                >
                    {/* Header Bar */}
                    <div className="px-4 sm:px-5 py-3 sm:py-4 bg-white border-b border-slate-200/80 flex items-center justify-between shrink-0 shadow-2xs">
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20 shrink-0">
                                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight truncate">
                                        Query Explorer
                                    </h2>
                                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-extrabold tracking-wide uppercase shrink-0">
                                        Finance One
                                    </span>
                                </div>
                                <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">
                                    Explore your money through visual questions
                                </p>
                            </div>
                        </div>

                        {/* Top Action Controls */}
                        <div className="flex items-center gap-1 shrink-0">
                            {/* Expand / Minimize Toggle (hidden on mobile) */}
                            <button
                                type="button"
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="hidden sm:inline-flex p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                title={isExpanded ? "Collapse panel" : "Expand panel"}
                            >
                                {isExpanded ? (
                                    <Minimize2 className="w-4 h-4" />
                                ) : (
                                    <Maximize2 className="w-4 h-4" />
                                )}
                            </button>

                            {/* Close Button */}
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Close Query Explorer"
                                aria-label="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Query Builder Body */}
                    <div className="flex-1 overflow-hidden relative">
                        <QueryBuilder onClose={onClose} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export const FinanceAIPanel = QueryExplorerPanel;
export default QueryExplorerPanel;
