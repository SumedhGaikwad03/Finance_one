import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Wallet, Menu, X, ArrowRight } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export const LandingNav = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const scrollToSection = (id: string) => {
        setMobileMenuOpen(false);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
                {/* Brand / Logo */}
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
                        <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight block leading-tight">
                                Finance One
                            </span>
                            <span className="text-[9px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200/80">
                                MVP 1
                            </span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                            Early Beta
                        </span>
                    </div>
                </Link>

                {/* Desktop Nav Links */}
                <nav className="hidden md:flex items-center gap-7 text-xs sm:text-sm font-semibold text-slate-600">
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
                </nav>

                {/* Desktop Action CTAs */}
                <div className="hidden md:flex items-center gap-3">
                    {isAuthenticated ? (
                        <button
                            type="button"
                            onClick={() => navigate("/dashboard")}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-200 transition-all cursor-pointer"
                        >
                            <span>Go to Dashboard</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                            >
                                Log in
                            </Link>
                            <Link
                                to="/register"
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <span>Get started</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    type="button"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                    aria-label="Toggle navigation menu"
                    aria-expanded={mobileMenuOpen}
                >
                    {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Navigation Drawer */}
            {mobileMenuOpen && (
                <div className="md:hidden px-4 pt-2 pb-6 bg-white border-b border-slate-200 space-y-4 animate-in fade-in slide-in-from-top-4 duration-150">
                    <nav className="flex flex-col space-y-2 text-sm font-semibold text-slate-700">
                        <button
                            type="button"
                            onClick={() => scrollToSection("features")}
                            className="text-left py-2 px-3 rounded-lg hover:bg-slate-50 hover:text-purple-600 transition-colors"
                        >
                            Features
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollToSection("showcase")}
                            className="text-left py-2 px-3 rounded-lg hover:bg-slate-50 hover:text-purple-600 transition-colors"
                        >
                            How it works
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollToSection("mvp1")}
                            className="text-left py-2 px-3 rounded-lg hover:bg-slate-50 hover:text-purple-600 transition-colors"
                        >
                            Why MVP 1?
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollToSection("ai-privacy")}
                            className="text-left py-2 px-3 rounded-lg hover:bg-slate-50 hover:text-purple-600 transition-colors"
                        >
                            AI & Privacy
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollToSection("heading")}
                            className="text-left py-2 px-3 rounded-lg hover:bg-slate-50 hover:text-purple-600 transition-colors"
                        >
                            Direction
                        </button>
                    </nav>

                    <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                        {isAuthenticated ? (
                            <button
                                type="button"
                                onClick={() => navigate("/dashboard")}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-sm"
                            >
                                <span>Go to Dashboard</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="w-full text-center py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200"
                                >
                                    Log in
                                </Link>
                                <Link
                                    to="/register"
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-200"
                                >
                                    <span>Get started</span>
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

export default LandingNav;
