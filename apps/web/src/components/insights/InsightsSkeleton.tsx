import React from "react";

export const InsightsSkeleton: React.FC = () => {
    return (
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-pulse">
            {/* Header Skeleton */}
            <div className="h-16 bg-slate-200 rounded-2xl w-full" />

            {/* MoM Card Skeleton */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200/80 space-y-4">
                <div className="flex justify-between items-center">
                    <div className="h-6 bg-slate-200 rounded-lg w-48" />
                    <div className="h-6 bg-slate-200 rounded-full w-24" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="h-20 bg-slate-100 rounded-2xl" />
                    <div className="h-20 bg-slate-100 rounded-2xl" />
                    <div className="h-20 bg-slate-100 rounded-2xl" />
                </div>
                <div className="h-10 bg-slate-100 rounded-xl" />
            </div>

            {/* Categories & Shifts Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-6 h-72 bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4">
                    <div className="h-5 bg-slate-200 rounded-lg w-36" />
                    <div className="space-y-3">
                        <div className="h-8 bg-slate-100 rounded-xl" />
                        <div className="h-8 bg-slate-100 rounded-xl" />
                        <div className="h-8 bg-slate-100 rounded-xl" />
                    </div>
                </div>
                <div className="lg:col-span-6 h-72 bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4">
                    <div className="h-5 bg-slate-200 rounded-lg w-36" />
                    <div className="space-y-3">
                        <div className="h-8 bg-slate-100 rounded-xl" />
                        <div className="h-8 bg-slate-100 rounded-xl" />
                        <div className="h-8 bg-slate-100 rounded-xl" />
                    </div>
                </div>
            </div>

            {/* Spending Tier Skeleton */}
            <div className="h-64 bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4">
                <div className="h-5 bg-slate-200 rounded-lg w-40" />
                <div className="h-4 bg-slate-200 rounded-full w-full" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="h-24 bg-slate-100 rounded-2xl" />
                    <div className="h-24 bg-slate-100 rounded-2xl" />
                    <div className="h-24 bg-slate-100 rounded-2xl" />
                </div>
            </div>
        </main>
    );
};
