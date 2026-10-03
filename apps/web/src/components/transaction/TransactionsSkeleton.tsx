const TransactionsSkeleton = () => {
    return (
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
                <div className="space-y-2">
                    <div className="h-4 w-36 bg-slate-200 rounded-md" />
                    <div className="h-8 w-48 bg-slate-200 rounded-lg" />
                    <div className="h-4 w-64 bg-slate-200 rounded-md" />
                </div>
                <div className="flex items-center gap-2.5">
                    <div className="h-9 w-24 bg-slate-200 rounded-xl" />
                    <div className="h-9 w-24 bg-slate-200 rounded-xl" />
                    <div className="h-9 w-36 bg-slate-200 rounded-xl" />
                </div>
            </div>

            {/* Toolbar Skeleton */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="h-9 flex-1 bg-slate-100 rounded-xl" />
                    <div className="flex gap-2">
                        <div className="h-9 w-32 bg-slate-100 rounded-xl" />
                        <div className="h-9 w-32 bg-slate-100 rounded-xl" />
                        <div className="h-9 w-32 bg-slate-100 rounded-xl" />
                    </div>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-100">
                    <div className="h-3.5 w-32 bg-slate-100 rounded" />
                    <div className="h-3.5 w-24 bg-slate-100 rounded" />
                </div>
            </div>

            {/* Table Skeleton */}
            <div className="bg-white rounded-3xl border border-slate-200 p-4 space-y-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                        key={i}
                        className="flex items-center justify-between py-3 border-b border-slate-100 last:border-b-0"
                    >
                        <div className="space-y-1.5 w-28">
                            <div className="h-4 w-20 bg-slate-200 rounded" />
                            <div className="h-3 w-14 bg-slate-100 rounded" />
                        </div>
                        <div className="space-y-1.5 w-44">
                            <div className="h-4 w-36 bg-slate-200 rounded" />
                            <div className="h-3 w-24 bg-slate-100 rounded" />
                        </div>
                        <div className="h-6 w-24 bg-slate-100 rounded-lg" />
                        <div className="h-5 w-20 bg-slate-100 rounded-md" />
                        <div className="h-5 w-16 bg-slate-200 rounded" />
                        <div className="h-7 w-16 bg-slate-100 rounded-lg" />
                    </div>
                ))}
            </div>
        </main>
    );
};

export default TransactionsSkeleton;
