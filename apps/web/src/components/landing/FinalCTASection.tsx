import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, HeartHandshake } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export const FinalCTASection = () => {
    const { isAuthenticated } = useAuth();

    return (
        <section className="py-20 sm:py-28 bg-white text-center relative overflow-hidden">
            {/* Ambient Background subtle gradient */}
            <div
                className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-white -z-10"
                aria-hidden="true"
            />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
                {/* 1. Early User Narrative Card */}
                <div className="p-8 sm:p-10 rounded-3xl bg-purple-50/50 border border-purple-200/70 text-left space-y-4 max-w-3xl mx-auto shadow-2xs">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-purple-700 text-[10px] sm:text-xs font-bold tracking-wider uppercase border border-purple-200/80 shadow-2xs">
                        <HeartHandshake className="w-3.5 h-3.5 text-purple-600" />
                        <span>Early Access · Building Forward</span>
                    </div>

                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                        You&apos;re early. That&apos;s intentional.
                    </h2>

                    <div className="space-y-3 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                        <p>
                            Finance One is being built iteratively. The current MVP gives you the core tools today while we learn what makes financial tracking genuinely easier.
                        </p>
                        <p>
                            Early usage helps shape what we build next, especially around transaction ingestion, financial queries, and privacy-conscious AI.
                        </p>
                    </div>
                </div>

                {/* 2. Final Conversion Call to Action */}
                <div className="space-y-4 pt-4">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-[10px] sm:text-xs font-bold tracking-wider uppercase border border-purple-200/60">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        <span>Simple · Structured · Real</span>
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                            Your money deserves a clearer picture.
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xl mx-auto">
                            Start building your personal financial ledger with Finance One today.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
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
            </div>
        </section>
    );
};

export default FinalCTASection;

