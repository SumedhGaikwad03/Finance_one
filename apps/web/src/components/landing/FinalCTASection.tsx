import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export const FinalCTASection = () => {
    const { isAuthenticated } = useAuth();

    return (
        <section className="py-20 sm:py-28 bg-white text-center relative overflow-hidden">
            {/* Ambient Background subtle gradient */}
            <div
                className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white -z-10"
                aria-hidden="true"
            />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200/60">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>Simple. Structured. Real.</span>
                </div>

                <div className="space-y-3">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                        Your money deserves a clearer picture.
                    </h2>
                    <p className="text-sm sm:text-base text-slate-500 font-medium max-w-xl mx-auto">
                        Start building your personal financial ledger with Finance One.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    {isAuthenticated ? (
                        <Link
                            to="/dashboard"
                            className="btn-interactive w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <span>Open Your Dashboard</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    ) : (
                        <>
                            <Link
                                to="/register"
                                className="btn-interactive w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <span>Get started</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>

                            <Link
                                to="/login"
                                className="btn-interactive w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs transition-all"
                            >
                                <span>Log in</span>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
};

export default FinalCTASection;
