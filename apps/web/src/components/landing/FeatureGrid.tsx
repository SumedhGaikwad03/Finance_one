import { Receipt, PiggyBank, BarChart3, ShieldCheck } from "lucide-react";

const FEATURES = [
    {
        icon: Receipt,
        title: "Track spending",
        description:
            "Add and view your transactions with ease. Keep a clear record of where your money goes.",
        accentColor: "bg-purple-100 text-purple-700",
    },
    {
        icon: PiggyBank,
        title: "Set budgets",
        description:
            "Create budgets and monitor how your spending compares with your limits.",
        accentColor: "bg-indigo-100 text-indigo-700",
    },
    {
        icon: BarChart3,
        title: "Understand your spending",
        description:
            "Explore categories, spending patterns, and useful financial breakdowns.",
        accentColor: "bg-teal-100 text-teal-700",
    },
    {
        icon: ShieldCheck,
        title: "Stay in control",
        description:
            "Keep your financial information organized in one personal ledger.",
        accentColor: "bg-amber-100 text-amber-700",
    },
];

export const FeatureGrid = () => {
    return (
        <section id="features" className="py-16 sm:py-24 bg-white border-y border-slate-200/80">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
                {/* Section Header */}
                <div className="text-center max-w-2xl mx-auto space-y-3">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200/60">
                        Core Capabilities
                    </span>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                        Everything you need to master your money
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium">
                        Essential tools built for precision, clarity, and ease of daily use.
                    </p>
                </div>

                {/* 4 Feature Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
                    {FEATURES.map((feature, index) => {
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
