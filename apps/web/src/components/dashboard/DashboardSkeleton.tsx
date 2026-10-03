const DashboardSkeleton = () => {
    return (
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-pulse">
            {/* 1. Header Skeleton */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
                <div className="space-y-2">
                    <div className="h-4 w-32 bg-slate-200 rounded-md" />
                    <div className="h-8 w-56 bg-slate-200 rounded-lg" />
                    <div className="h-4 w-40 bg-slate-200 rounded-md" />
                </div>
                <div className="flex items-center gap-2.5">
                    <div className="h-9 w-24 bg-slate-200 rounded-xl" />
                    <div className="h-9 w-28 bg-slate-200 rounded-xl" />
                    <div className="h-9 w-24 bg-slate-200 rounded-xl" />
                </div>
            </div>

            {/* 2. Primary 70/30 Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* 70% Budget Hero Skeleton */}
                <div className="lg:col-span-7 xl:col-span-8 p-6 sm:p-7 bg-slate-900/10 border border-slate-200 rounded-3xl space-y-6 flex flex-col justify-between min-h-[300px]">
                    <div className="flex justify-between items-center">
                        <div className="h-5 w-28 bg-slate-200 rounded-full" />
                        <div className="h-5 w-20 bg-slate-200 rounded-full" />
                    </div>
                    <div className="space-y-2">
                        <div className="h-10 w-56 bg-slate-200 rounded-lg" />
                        <div className="h-4 w-40 bg-slate-200 rounded-md" />
                    </div>
                    <div className="space-y-2">
                        <div className="h-3 w-full bg-slate-200 rounded-full" />
                        <div className="flex justify-between">
                            <div className="h-3 w-8 bg-slate-200 rounded" />
                            <div className="h-3 w-16 bg-slate-200 rounded" />
                        </div>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                        <div className="h-4 w-48 bg-slate-200 rounded-md" />
                        <div className="flex gap-2">
                            <div className="h-8 w-28 bg-slate-200 rounded-xl" />
                            <div className="h-8 w-32 bg-slate-200 rounded-xl" />
                        </div>
                    </div>
                </div>

                {/* 30% Spending Breakdown Skeleton */}
                <div className="lg:col-span-5 xl:col-span-4 p-6 bg-white border border-slate-200 rounded-3xl space-y-5 flex flex-col justify-between min-h-[300px]">
                    <div className="space-y-1.5">
                        <div className="h-5 w-36 bg-slate-200 rounded-md" />
                        <div className="h-3.5 w-28 bg-slate-200 rounded-md" />
                    </div>
                    <div className="flex justify-center py-2">
                        <div className="w-36 h-36 rounded-full border-8 border-slate-100 bg-slate-50 flex items-center justify-center">
                            <div className="h-5 w-16 bg-slate-200 rounded" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-4 w-full bg-slate-100 rounded" />
                        <div className="h-4 w-full bg-slate-100 rounded" />
                    </div>
                </div>
            </div>

            {/* 3. KPI Row Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl space-y-2">
                        <div className="h-3 w-28 bg-slate-100 rounded" />
                        <div className="h-7 w-36 bg-slate-200 rounded-lg" />
                    </div>
                ))}
            </div>

            {/* 4. Secondary 2-Column Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <div className="h-72 bg-white border border-slate-200 rounded-3xl" />
                <div className="h-72 bg-white border border-slate-200 rounded-3xl" />
            </div>
        </main>
    );
};

export default DashboardSkeleton;
