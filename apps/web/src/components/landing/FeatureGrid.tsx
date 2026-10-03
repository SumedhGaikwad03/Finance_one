import { Receipt, PiggyBank, BarChart3, Search, CheckCircle2 } from "lucide-react";

const PILLARS = [
    {
        title: "TRACK",
        subtitle: "Keep a clear record of where your money goes.",
        accent: "from-purple-500/10 to-purple-500/0 text-purple-700 border-purple-200/80",
    },
    {
        title: "PLAN",
        subtitle: "Create budgets and stay aware of your spending.",
        accent: "from-indigo-500/10 to-indigo-500/0 text-indigo-700 border-indigo-200/80",
    },
    {
        title: "UNDERSTAND",
        subtitle: "Explore your spending through useful breakdowns and queries.",
        accent: "from-teal-500/10 to-teal-500/0 text-teal-700 border-teal-200/80",
    },
];

const CAPABILITIES = [
    {
        icon: Receipt,
        title: "Transaction tracking",
        description:
            "Record expenses quickly with custom categories, priority tags, and clean notes.",
        accentColor: "bg-purple-100 text-purple-700",
    },
    {
        icon: PiggyBank,
        title: "Budget management",
        description:
            "Set monthly spending limits by category and monitor live progress gauges.",
        accentColor: "bg-indigo-100 text-indigo-700",
    },
    {
        icon: BarChart3,
        title: "Spending breakdowns",
        description:
            "Visualize your money with clean category distribution charts and daily trends.",
        accentColor: "bg-teal-100 text-teal-700",
    },
    {
        icon: Search,
        title: "Financial query exploration",
        description:
            "Fast, deterministic query builder to instantly answer questions like \"Where did I spend?\".",
        accentColor: "bg-amber-100 text-amber-700",
    },
];

export const FeatureGrid = () => {
    return (
        <section id="features" className="py-16 sm:py-24 bg-white border-y border-slate-200/80">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12 sm:space-y-16">
                {/* Section Header */}
                <div className="text-center max-w-2xl mx-auto space-y-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-[10px] sm:text-xs font-bold tracking-wider uppercase border border-purple-200/70 shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                        <span>Available Now</span>
                    </span>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                        What you can do today
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium">
                        Essential tools built for precision, clarity, and ease of daily use.
                    </p>
                </div>

                {/* 3 Foundational Pillars */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                    {PILLARS.map((pillar, idx) => (
                        <div
                            key={idx}
                            className={`p-6 rounded-2xl bg-gradient-to-b ${pillar.accent} bg-white border shadow-2xs space-y-2`}
                        >
                            <span className="text-xs font-black tracking-widest block">
                                {pillar.title}
                            </span>
                            <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                                {pillar.subtitle}
                            </p>
                        </div>
                    ))}
                </div>

                {/* 4 Feature Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
                    {CAPABILITIES.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <div
                                key={index}
                                className="p-6 sm:p-7 rounded-3xl bg-slate-50/60 border border-slate-200/80 hover:border-purple-200 hover:bg-white transition-all shadow-xs hover:shadow-md space-y-4 group"
                            >
                                <div
                                    className={`w-12 h-12 rounded-2xl ${feature.accentColor} flex items-center justify-center group-hover:scale-105 transition-transform`}
                                >
                                    <Icon className="w-6 h-6" />
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                                        {feature.title}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default FeatureGrid;

