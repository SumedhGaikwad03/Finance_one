import { Sparkles, ArrowUpRight, TrendingUp } from "lucide-react";

export const ProductShowcase = () => {
    return (
        <div className="relative w-full max-w-xl mx-auto lg:max-w-none">
            {/* Ambient Background Glow */}
            <div
                className="absolute -inset-2 sm:-inset-4 bg-gradient-to-tr from-purple-500/15 via-indigo-500/10 to-transparent rounded-3xl blur-2xl -z-10"
                aria-hidden="true"
            />

            {/* Main Desktop Dashboard Window Mockup */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden text-slate-800 transition-all">
                {/* Window Top Header Bar */}
                <div className="px-4 sm:px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1.5" aria-hidden="true">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                        </div>
                        <span className="text-[11px] font-bold text-slate-500 ml-2">
                            Finance One • Dashboard
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 text-[10px] font-extrabold uppercase tracking-wide">
                            October 2026
                        </span>
                    </div>
                </div>

                {/* Window Body */}
                <div className="p-4 sm:p-5 space-y-4 bg-slate-50/50">
                    {/* 1. Budget Hero Card Mockup */}
                    <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                    Monthly Active Budget
                                </span>
                                <span className="text-lg sm:text-xl font-black text-slate-900">
                                    ₹45,000
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                                    <TrendingUp className="w-3 h-3" />
                                    On Track
                                </span>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="space-y-1.5">
                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full"
                                    style={{ width: "41%" }}
                                />
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                                <span>₹18,450 spent (41.0%)</span>
                                <span className="text-purple-700 font-bold">₹26,550 remaining</span>
                            </div>
                        </div>
                    </div>

                    {/* 2. Key Metric Cards Row */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        <div className="p-3 bg-white rounded-xl border border-slate-200/70 shadow-2xs">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                                Total Spent
                            </span>
                            <span className="text-xs sm:text-sm font-extrabold text-slate-900 block truncate">
                                ₹18,450
                            </span>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-slate-200/70 shadow-2xs">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                                Transactions
                            </span>
                            <span className="text-xs sm:text-sm font-extrabold text-slate-900 block truncate">
                                24 logs
                            </span>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-slate-200/70 shadow-2xs">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                                Daily Average
                            </span>
                            <span className="text-xs sm:text-sm font-extrabold text-slate-900 block truncate">
                                ₹768 / day
                            </span>
                        </div>
                    </div>

                    {/* 3. Recent Transactions Mini List */}
                    <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Recent Transactions
                            </span>
                            <span className="text-[10px] font-semibold text-purple-600 flex items-center gap-0.5">
                                Live Ledger <ArrowUpRight className="w-2.5 h-2.5" />
                            </span>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs py-1">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="w-6 h-6 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center text-xs shrink-0">
                                        🍔
                                    </span>
                                    <span className="font-bold text-slate-800 truncate">Swiggy Dinner</span>
                                </div>
                                <span className="font-extrabold text-slate-900">₹650</span>
                            </div>

                            <div className="flex items-center justify-between text-xs py-1">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs shrink-0">
                                        🚕
                                    </span>
                                    <span className="font-bold text-slate-800 truncate">Uber Ride</span>
                                </div>
                                <span className="font-extrabold text-slate-900">₹320</span>
                            </div>

                            <div className="flex items-center justify-between text-xs py-1">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-xs shrink-0">
                                        📺
                                    </span>
                                    <span className="font-bold text-slate-800 truncate">Netflix Subscription</span>
                                </div>
                                <span className="font-extrabold text-slate-900">₹649</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Query Explorer Preview Pill */}
            <div className="hidden sm:flex absolute -bottom-5 -right-3 sm:-right-5 p-3.5 bg-white/95 backdrop-blur-md rounded-2xl border border-purple-200/90 shadow-xl items-center gap-3 animate-in zoom-in-90 duration-300">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/30 shrink-0">
                    <Sparkles className="w-4 h-4" />
                </div>
                <div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-900">Query Explorer</span>
                        <span className="px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-700 text-[8px] font-black uppercase">
                            Instant
                        </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">
                        Food spending this month: <strong className="text-purple-700">₹7,850</strong>
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ProductShowcase;
