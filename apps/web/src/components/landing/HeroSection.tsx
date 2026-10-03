import { Link } from "react-router-dom";
import { ArrowRight, Check, Sparkles, Compass } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import ProductShowcase from "./ProductShowcase";

export const HeroSection = () => {
    const { isAuthenticated } = useAuth();
    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <section className="relative pt-8 sm:pt-14 pb-16 sm:pb-24 overflow-hidden">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
                    {/* Left Column: Hero Content */}
                    <div className="lg:col-span-6 space-y-6 sm:space-y-8 text-center lg:text-left">
                        {/* Prominent Early Beta Badge */}
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200/90 text-purple-800 text-[11px] sm:text-xs font-black tracking-wider uppercase shadow-2xs">
                            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                            <span>Early Beta · MVP 1</span>
                        </div>

                        {/* Main Headline */}
                        <h1 className="text-3.5xl sm:text-5xl lg:text-5.5xl font-black text-slate-900 tracking-tight leading-[1.12]">
                            Track. Understand.{" "}
                            <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent block sm:inline">
                                Take Control.
                            </span>
                        </h1>

                        {/* Supporting Copy & Early Journey Statement */}
                        <div className="space-y-3 max-w-xl mx-auto lg:mx-0">
                            <p className="text-sm sm:text-base text-slate-700 font-medium leading-relaxed">
                                Finance One is an early-stage personal finance ledger built to make tracking spending, managing budgets, and understanding your money simpler.
                            </p>
                            <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed">
                                You&apos;re seeing Finance One at the beginning of its journey. The core experience is live, while we&apos;re actively exploring what comes next.
                            </p>
                        </div>

                        {/* Action CTA Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-1">
                            {isAuthenticated ? (
                                <Link
                                    to="/dashboard"
                                    className="btn-interactive w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <span>Go to Dashboard</span>
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            ) : (
                                <Link
                                    to="/register"
                                    className="btn-interactive w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <span>Get started</span>
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            )}

                            <button
                                type="button"
                                onClick={() => scrollToSection("features")}
                                className="btn-interactive w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs transition-all cursor-pointer"
                            >
                                <Compass className="w-4 h-4 text-purple-600" />
                                <span>Explore Finance One</span>
                            </button>
                        </div>

                        {/* 3 Compact Trust / Value Indicators */}
                        <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-xs font-semibold text-slate-500">
                            <div className="flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                                </span>
                                <span>Track your spending</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                                </span>
                                <span>Set meaningful budgets</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                                </span>
                                <span>Understand your money</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Interactive Product Showcase */}
                    <div id="showcase" className="lg:col-span-6 pt-4 lg:pt-0">
                        <ProductShowcase />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
