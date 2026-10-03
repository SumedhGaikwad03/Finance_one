import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Settings } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { ExploreButton } from "../ai/FinanceAIButton";

type DashboardHeaderProps = {
    username?: string;
    onOpenExplorer?: () => void;
    onOpenAI?: () => void;
};

const DashboardHeader = ({ username, onOpenExplorer, onOpenAI }: DashboardHeaderProps) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const handleOpenExplorer = onOpenExplorer || onOpenAI;

    const displayName = username || user?.name || "there";

    // Time of day greeting
    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 17) return "Good afternoon";
        return "Good evening";
    }, []);

    // Formatted current date
    const currentDate = useMemo(() => {
        return new Intl.DateTimeFormat("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        }).format(new Date());
    }, []);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-purple-100 text-purple-700 text-xs font-bold">
                        1
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-purple-700">
                        Finance One
                    </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                    {greeting}, {displayName}
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                    {currentDate}
                </p>
            </div>

            <div className="flex items-center gap-2.5">
                {handleOpenExplorer && (
                    <ExploreButton onClick={handleOpenExplorer} />
                )}
                <button
                    type="button"
                    onClick={() => navigate("/budgets")}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                    Budgets
                </button>
                <button
                    type="button"
                    onClick={() => navigate("/settings")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-xs"
                    aria-label="Settings"
                >
                    <Settings className="w-3.5 h-3.5 text-slate-500" />
                    <span>Settings</span>
                </button>
                <button
                    type="button"
                    onClick={handleLogout}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900 bg-transparent hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                    Sign out
                </button>
            </div>
        </header>
    );
};

export default DashboardHeader;