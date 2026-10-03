import React from "react";
import { Compass, Target, TrendingUp } from "lucide-react";

const FEATURES = [
    {
        title: "TRACK",
        description: "Know where your money goes.",
        icon: Compass,
    },
    {
        title: "PLAN",
        description: "Stay on top of what matters.",
        icon: Target,
    },
    {
        title: "GROW",
        description: "Make smarter decisions.",
        icon: TrendingUp,
    },
];

export const AuthFeatureCards: React.FC = () => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
            {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                    <div
                        key={feature.title}
                        className="flex items-start gap-3 p-4 rounded-2xl bg-white/90 border border-slate-200/80 shadow-xs backdrop-blur-xs transition-all duration-200 hover:border-indigo-200 hover:shadow-sm"
                    >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex-shrink-0">
                            <Icon className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5 text-left">
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                {feature.title}
                            </h4>
                            <p className="text-[12px] text-slate-500 leading-snug">
                                {feature.description}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default AuthFeatureCards;
