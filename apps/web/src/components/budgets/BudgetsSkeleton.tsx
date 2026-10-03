const BudgetsSkeleton = () => {
    return (
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
                <div className="space-y-2">
                    <div className="h-4 w-32 bg-slate-200 rounded-md" />
                    <div className="h-8 w-56 bg-slate-200 rounded-lg" />
                    <div className="h-4 w-72 bg-slate-200 rounded-md" />
                </div>
                <div className="flex items-center gap-2.5">
                    <div className="h-9 w-24 bg-slate-200 rounded-xl" />
                    <div className="h-9 w-28 bg-slate-200 rounded-xl" />
                    <div className="h-9 w-32 bg-slate-200 rounded-xl" />
                </div>
            </div>

            {/* Hero Card Skeleton */}
            <div className="h-64 sm:h-56 w-full bg-slate-900/10 rounded-3xl" />

            {/* Grid Header Skeleton */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="h-6 w-36 bg-slate-200 rounded-md" />
                    <div className="h-4 w-20 bg-slate-200 rounded-md" />
                </div>

                {/* Grid Cards Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="h-48 bg-slate-100 rounded-2xl border border-slate-200 p-5 space-y-4"
                        >
                            <div className="flex justify-between items-center">
                                <div className="h-5 w-20 bg-slate-200 rounded-md" />
                                <div className="h-5 w-16 bg-slate-200 rounded-full" />
                            </div>
                            <div className="space-y-1.5">
                                <div className="h-3 w-16 bg-slate-200 rounded" />
                                <div className="h-7 w-28 bg-slate-200 rounded" />
                            </div>
                            <div className="h-4 w-40 bg-slate-200 rounded pt-2" />
                            <div className="h-8 w-full bg-slate-200/60 rounded-lg mt-4" />
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
};

export default BudgetsSkeleton;
