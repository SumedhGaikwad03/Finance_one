import { Compass, Sparkles, ArrowDown, Database, Cpu, Search, Lock } from "lucide-react";

const STAGES = [
    {
        badge: "MVP 1 · LIVE",
        badgeStyle: "bg-emerald-100 text-emerald-800 border-emerald-200",
        title: "Core financial ledger",
        description: "Recording transactions, managing budgets, and understanding spending.",
        icon: Database,
        isCurrent: true,
    },
    {
        badge: "COMING NEXT",
        badgeStyle: "bg-purple-100 text-purple-800 border-purple-200",
        title: "Better ingestion",
        description: "Less manual transaction entry through lower-friction capture channels.",
        icon: Cpu,
        isCurrent: false,
    },
    {
        badge: "EXPLORING",
        badgeStyle: "bg-indigo-100 text-indigo-800 border-indigo-200",
        title: "Smarter queries",
        description: "More natural financial exploration and intent-driven query understanding.",
        icon: Search,
        isCurrent: false,
    },
    {
        badge: "VISION",
        badgeStyle: "bg-slate-100 text-slate-700 border-slate-200",
        title: "Privacy-conscious intelligence",
        description: "Useful automation and financial insights without unnecessary access.",
        icon: Lock,
        isCurrent: false,
    },
];

export const RoadmapSection = () => {
    return (
        <section id="heading" className="py-16 sm:py-24 bg-slate-50/60 border-b border-slate-200/80">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-16">
                {/* Visual Block: We're Still Figuring Out the Right AI */}
                <div className="p-8 sm:p-12 rounded-3.5xl bg-white border border-slate-200/90 shadow-xs space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-[10px] sm:text-xs font-bold tracking-wider uppercase border border-purple-200/80 shadow-2xs">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        <span>AI · Exploration</span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight max-w-2xl">
                        We&apos;re still figuring out the right AI.
                    </h2>

                    <div className="space-y-3.5 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-3xl">
                        <p>
                            Finance One&apos;s current MVP focuses on getting the fundamentals right: recording transactions, managing budgets, and understanding spending.
                        </p>
                        <p>
                            We&apos;re experimenting with different approaches to AI, particularly around <strong className="text-slate-900 font-bold">natural financial query understanding and low-friction transaction ingestion</strong>.
                        </p>
                        <p>
                            The goal isn&apos;t simply to add more AI. It&apos;s to find an implementation that is genuinely useful, privacy-conscious, and feels natural to use.
                        </p>
                    </div>
                </div>

                {/* Where Finance One is heading - Visual Progression */}
                <div className="space-y-8">
                    <div className="text-center max-w-2xl mx-auto space-y-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-[10px] sm:text-xs font-bold tracking-wider uppercase border border-purple-200/70 shadow-2xs">
                            <Compass className="w-3.5 h-3.5 text-purple-600" />
                            <span>Product Direction</span>
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                            Where Finance One is heading
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium">
                            A transparent roadmap of our staged progression. Directional, not unbuilt promises.
                        </p>
                    </div>

                    {/* Progression Stack */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                        {STAGES.map((stage, idx) => {
                            const Icon = stage.icon;
                            return (
                                <div key={idx} className="flex flex-col relative group">
                                    <div
                                        className={`p-6 rounded-2xl border transition-all h-full space-y-3.5 flex flex-col justify-between ${
                                            stage.isCurrent
                                                ? "bg-white border-purple-300 shadow-sm ring-2 ring-purple-500/10"
                                                : "bg-white/80 border-slate-200/80 hover:bg-white hover:border-slate-300 shadow-2xs"
                                        }`}
                                    >
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stage.isCurrent ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-600"}`}>
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${stage.badgeStyle}`}>
                                                    {stage.badge}
                                                </span>
                                            </div>

                                            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                                                {stage.title}
                                            </h3>
                                        </div>

                                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                            {stage.description}
                                        </p>
                                    </div>

                                    {/* Mobile/Desktop Connecting indicator */}
                                    {idx < STAGES.length - 1 && (
                                        <div className="md:hidden flex justify-center py-1 text-slate-300">
                                            <ArrowDown className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default RoadmapSection;
