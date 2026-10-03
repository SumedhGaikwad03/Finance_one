import { Link } from "react-router-dom";
import { Wallet } from "lucide-react";

export const LandingFooter = () => {
    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <footer className="py-12 bg-slate-50 border-t border-slate-200/80 text-slate-500 text-xs">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    {/* Brand */}
                    <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-purple-600 text-white shadow-xs">
                            <Wallet className="w-4 h-4" />
                        </div>
                        <span className="font-extrabold text-slate-900 text-sm">
                            Finance One
                        </span>
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200/80">
                            Early Beta · MVP 1
                        </span>
                    </div>

                    {/* Nav Links */}
                    <div className="flex flex-wrap items-center justify-center gap-6 font-semibold text-slate-600">
                        <button
                            type="button"
                            onClick={() => scrollToSection("features")}
                            className="hover:text-purple-600 transition-colors cursor-pointer"
                        >
                            Features
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollToSection("showcase")}
                            className="hover:text-purple-600 transition-colors cursor-pointer"
                        >
                            How it works
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollToSection("mvp1")}
                            className="hover:text-purple-600 transition-colors cursor-pointer"
                        >
                            Why MVP 1?
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollToSection("ai-privacy")}
                            className="hover:text-purple-600 transition-colors cursor-pointer"
                        >
                            AI & Privacy
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollToSection("heading")}
                            className="hover:text-purple-600 transition-colors cursor-pointer"
                        >
                            Direction
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollToSection("philosophy")}
                            className="hover:text-purple-600 transition-colors cursor-pointer"
                        >
                            Philosophy
                        </button>
                        <Link
                            to="/login"
                            className="hover:text-purple-600 transition-colors"
                        >
                            Log in
                        </Link>
                        <Link
                            to="/register"
                            className="hover:text-purple-600 transition-colors"
                        >
                            Register
                        </Link>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
                    <p>© 2026 Finance One. All rights reserved.</p>
                    <p>Designed for clarity, deterministic accuracy, and speed.</p>
                </div>
            </div>
        </footer>
    );
};

export default LandingFooter;
