import { ShieldCheck, Sparkles, SlidersHorizontal, Lock } from "lucide-react";

const PRINCIPLES = [
    {
        icon: Lock,
        title: "PRIVATE BY DESIGN",
        description: "Explore smarter automation without unnecessary access to personal data.",
        accent: "bg-purple-100 text-purple-700",
    },
    {
        icon: Sparkles,
        title: "LESS MANUAL INPUT",
        description: "Find better ways to capture financial activity with minimal user effort.",
        accent: "bg-indigo-100 text-indigo-700",
    },
    {
        icon: SlidersHorizontal,
        title: "USER IN CONTROL",
        description: "Automation should assist the user, not silently make financial decisions for them.",
        accent: "bg-teal-100 text-teal-700",
    },
];

export const AIPrivacySection = () => {
    return (
        <section id="ai-privacy" className="py-16 sm:py-24 bg-white border-b border-slate-200/80">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12 sm:space-y-14">
                {/* Header & Exact Body Copy */}
                <div className="max-w-3xl space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-[10px] sm:text-xs font-bold tracking-wider uppercase border border-purple-200/80 shadow-2xs">
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                        <span>AI & Privacy — What We&apos;re Exploring</span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                        A smarter way to capture and understand your money.
                    </h2>

                    <div className="space-y-3 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                        <p>
                            We&apos;re exploring ways to make transaction capture and financial query digestion more seamless, so users spend less time manually entering information.
                        </p>
                        <p>
                            The challenge is doing that <strong className="text-slate-900 font-bold">without compromising privacy or taking control away from the user</strong>.
                        </p>
                        <p>
                            Our goal is to find an approach that can understand useful financial context while keeping sensitive financial data protected and giving the user control over what is captured, processed, and stored.
                        </p>
                    </div>
                </div>

                {/* The Three Principles Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                    {PRINCIPLES.map((principle, idx) => {
                        const Icon = principle.icon;
                        return (
                            <div
                                key={idx}
                                className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-purple-200 hover:bg-white transition-all shadow-2xs space-y-3 group"
                            >
                                <div
                                    className={`w-10 h-10 rounded-xl ${principle.accent} flex items-center justify-center group-hover:scale-105 transition-transform`}
                                >
                                    <Icon className="w-5 h-5" />
                                </div>
                                <h3 className="text-xs font-black tracking-wider uppercase text-slate-900">
                                    {principle.title}
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                                    {principle.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default AIPrivacySection;
