import { MessageSquareCode, Sparkles, Layers } from "lucide-react";

export const MVPSection = () => {
    return (
        <section id="mvp-roadmap" className="py-16 sm:py-24 bg-slate-50/50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="p-8 sm:p-12 rounded-3.5xl bg-gradient-to-b from-white to-slate-50 border border-slate-200/90 shadow-sm space-y-10">
                    {/* Header Banner */}
                    <div className="max-w-3xl space-y-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-[10px] sm:text-xs font-black uppercase tracking-wider">
                            MVP 1.0 — LIVE & USABLE
                        </span>
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                            An early step toward a more intelligent financial experience.
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                            Finance One is currently an MVP. The core ledger, transaction tracking, budgeting, and financial exploration features are already usable.
                        </p>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                            We're actively exploring how AI can make financial analysis more natural and useful without adding unnecessary complexity to the experience.
                        </p>
                    </div>

                    {/* 3 Supporting Pillars */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                        <div className="p-5 rounded-2xl bg-white border border-slate-200/70 shadow-2xs space-y-2.5">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                                <MessageSquareCode className="w-5 h-5" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900">
                                Built with feedback
                            </h3>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                The product is evolving through real usage and iteration.
                            </p>
                        </div>

                        <div className="p-5 rounded-2xl bg-white border border-slate-200/70 shadow-2xs space-y-2.5">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900">
                                Exploring AI
                            </h3>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                We're testing different approaches to make financial analysis more useful.
                            </p>
                        </div>

                        <div className="p-5 rounded-2xl bg-white border border-slate-200/70 shadow-2xs space-y-2.5">
                            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                                <Layers className="w-5 h-5" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900">
                                Building forward
                            </h3>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                The goal is a simpler, smarter way to understand your money.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default MVPSection;
