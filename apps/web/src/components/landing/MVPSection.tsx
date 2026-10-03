import { Check, ArrowRight, Sparkles, Shield } from "lucide-react";

export const MVPSection = () => {
    return (
        <section id="mvp1" className="py-16 sm:py-24 bg-slate-50/70 border-b border-slate-200/80">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="p-8 sm:p-12 rounded-3.5xl bg-white border border-slate-200/90 shadow-xs space-y-10">
                    {/* Header Banner */}
                    <div className="max-w-3xl space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-[10px] sm:text-xs font-bold tracking-wider uppercase border border-purple-200/80">
                            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                            <span>Early Beta · MVP 1</span>
                        </div>

                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                            MVP 1 is about getting the fundamentals right.
                        </h2>

                        <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
                            Finance One&apos;s first release focuses on the fundamentals of personal finance tracking: recording transactions, managing budgets, and understanding spending.
                        </p>
                    </div>

                    {/* Available Now vs Being Explored Comparison Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                        {/* Available Now Card */}
                        <div className="p-6 sm:p-7 rounded-2xl bg-emerald-50/40 border border-emerald-200/80 space-y-5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
                                    Available Now
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100/80 text-emerald-800">
                                    Live in App
                                </span>
                            </div>

                            <ul className="space-y-3 text-xs sm:text-sm font-semibold text-slate-800">
                                <li className="flex items-center gap-2.5">
                                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                                    </span>
                                    <span>Transaction tracking</span>
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                                    </span>
                                    <span>Budget management</span>
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                                    </span>
                                    <span>Spending breakdowns</span>
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                                    </span>
                                    <span>Financial query exploration</span>
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                                    </span>
                                    <span>Personal finance dashboard</span>
                                </li>
                            </ul>
                        </div>

                        {/* Being Explored Card */}
                        <div className="p-6 sm:p-7 rounded-2xl bg-purple-50/40 border border-purple-200/80 space-y-5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase tracking-wider text-purple-800">
                                    Being Explored
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100/80 text-purple-800">
                                    Under Research
                                </span>
                            </div>

                            <ul className="space-y-3 text-xs sm:text-sm font-semibold text-slate-800">
                                <li className="flex items-center gap-2.5">
                                    <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                                        <ArrowRight className="w-2.5 h-2.5 stroke-[3]" />
                                    </span>
                                    <span>Lower-friction transaction ingestion</span>
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                                        <ArrowRight className="w-2.5 h-2.5 stroke-[3]" />
                                    </span>
                                    <span>More natural financial query understanding</span>
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                                        <Shield className="w-2.5 h-2.5 stroke-[3]" />
                                    </span>
                                    <span>Privacy-conscious automation</span>
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                                        <ArrowRight className="w-2.5 h-2.5 stroke-[3]" />
                                    </span>
                                    <span>Future AI-assisted financial exploration</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default MVPSection;

