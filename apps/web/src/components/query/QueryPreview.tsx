import type { TransactionCategory, TransactionPriority } from "../../types/dashboard.types";
import { CATEGORY_METADATA } from "./CategorySelector";

interface QueryPreviewProps {
    categories: TransactionCategory[];
    priorities: TransactionPriority[];
    dateLabel: string;
    amountLabel: string;
    search?: string;
    sortByLabel: string;
}

const QueryPreview = ({
    categories,
    priorities,
    dateLabel,
    amountLabel,
    search,
    sortByLabel,
}: QueryPreviewProps) => {
    const categoryText =
        categories.length === 0
            ? "all categories"
            : categories.map((c) => CATEGORY_METADATA[c]?.label ?? c).join(", ");

    const priorityText =
        priorities.length === 0
            ? "any priority"
            : priorities
                  .map((p) => (p === "ESSENTIAL" ? "Essential" : p === "GOOD_TO_HAVE" ? "Good to Have" : "Luxury"))
                  .join(" or ");

    return (
        <div className="p-4 bg-gradient-to-r from-purple-50/80 via-indigo-50/50 to-slate-50 border border-purple-100 rounded-2xl">
            <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
                    Query Summary Preview
                </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                <span>Looking for transactions in </span>
                <strong className="text-purple-900 font-semibold">{categoryText}</strong>
                <span> with </span>
                <strong className="text-slate-900 font-semibold">{priorityText}</strong>
                <span> during </span>
                <strong className="text-indigo-900 font-semibold">{dateLabel}</strong>
                <span> with amount </span>
                <strong className="text-emerald-900 font-semibold">{amountLabel}</strong>
                {search ? (
                    <>
                        <span> matching keyword </span>
                        <strong className="text-amber-900 font-semibold">&ldquo;{search}&rdquo;</strong>
                    </>
                ) : null}
                <span>, sorted by </span>
                <strong className="text-slate-800 font-semibold">{sortByLabel.toLowerCase()}</strong>.
            </p>
        </div>
    );
};

export default QueryPreview;
