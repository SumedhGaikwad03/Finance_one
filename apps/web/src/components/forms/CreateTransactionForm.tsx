import { useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IndianRupee, ShieldAlert, Calendar, FileText, Type } from "lucide-react";
import type { Transaction } from "../../types/dashboard.types";
import CategorySelect from "./CategorySelect";

import {
    createTransactionSchema,
    type CreateTransactionFormData,
} from "../../utils/transaction.schema";

interface CreateTransactionFormProps {
    onSubmit: (data: CreateTransactionFormData) => void;
    transaction?: Transaction | null;
    onCancel?: () => void;
    isSubmitting?: boolean;
}

// Formats a Date object or ISO string to datetime-local input value
const formatDateTimeLocal = (date?: string | Date) => {
    const parsedDate = date ? new Date(date) : new Date();
    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
    const day = String(parsedDate.getDate()).padStart(2, "0");
    const hours = String(parsedDate.getHours()).padStart(2, "0");
    const minutes = String(parsedDate.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const CreateTransactionForm = ({
    onSubmit,
    transaction,
    onCancel,
    isSubmitting = false,
}: CreateTransactionFormProps) => {
    const isEditMode = Boolean(transaction);
    const amountInputRef = useRef<HTMLInputElement | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        control,
        formState: { errors },
    } = useForm<CreateTransactionFormData>({
        resolver: zodResolver(createTransactionSchema),
        defaultValues: {
            category: "FOOD",
            priority: "ESSENTIAL",
            transactionDate: formatDateTimeLocal(),
        },
    });

    // Populate fields when transaction prop changes
    useEffect(() => {
        if (transaction) {
            reset({
                amount: Number(transaction.amount),
                category: transaction.category,
                priority: transaction.priority,
                title: transaction.title ?? "",
                notes: transaction.notes ?? "",
                transactionDate: formatDateTimeLocal(transaction.transactionDate),
            });
        } else {
            reset({
                amount: undefined,
                category: "FOOD",
                priority: "ESSENTIAL",
                title: "",
                notes: "",
                transactionDate: formatDateTimeLocal(),
            });
        }

        // Autofocus amount input on mount/reset
        const timer = setTimeout(() => {
            amountInputRef.current?.focus();
        }, 80);
        return () => clearTimeout(timer);
    }, [transaction, reset]);

    const handleToday = () => {
        setValue("transactionDate", formatDateTimeLocal(new Date()), {
            shouldValidate: true,
        });
    };

    const handleYesterday = () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        setValue("transactionDate", formatDateTimeLocal(yesterday), {
            shouldValidate: true,
        });
    };

    const { ref: formAmountRef, ...amountRest } = register("amount", {
        valueAsNumber: true,
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Amount Field (Primary Focus) */}
            <div className="space-y-1.5">
                <label
                    htmlFor="amount"
                    className="block text-xs font-semibold text-slate-700"
                >
                    Amount (₹) *
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <IndianRupee className="w-4 h-4" />
                    </div>
                    <input
                        id="amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                            errors.amount
                                ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                                : "border-slate-200 focus:ring-purple-500/20 focus:border-purple-500"
                        }`}
                        {...amountRest}
                        ref={(e) => {
                            formAmountRef(e);
                            amountInputRef.current = e;
                        }}
                    />
                </div>
                {errors.amount?.message && (
                    <p className="text-xs text-rose-500 font-medium">
                        {errors.amount.message}
                    </p>
                )}
            </div>

            {/* Title Field */}
            <div className="space-y-1.5">
                <label
                    htmlFor="title"
                    className="block text-xs font-semibold text-slate-700"
                >
                    Title / Description
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Type className="w-4 h-4" />
                    </div>
                    <input
                        id="title"
                        type="text"
                        placeholder="e.g. Groceries, Uber, Coffee"
                        className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                            errors.title
                                ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                                : "border-slate-200 focus:ring-purple-500/20 focus:border-purple-500"
                        }`}
                        {...register("title")}
                    />
                </div>
                {errors.title?.message && (
                    <p className="text-xs text-rose-500 font-medium">
                        {errors.title.message}
                    </p>
                )}
            </div>

            {/* Category & Priority Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Category */}
                <div className="space-y-1.5">
                    <label
                        htmlFor="category"
                        className="block text-xs font-semibold text-slate-700"
                    >
                        Category *
                    </label>
                    <Controller
                        control={control}
                        name="category"
                        render={({ field }) => (
                            <CategorySelect
                                id="category"
                                value={field.value}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                error={errors.category?.message}
                                disabled={isSubmitting}
                            />
                        )}
                    />
                    {errors.category?.message && (
                        <p className="text-xs text-rose-500 font-medium">
                            {errors.category.message}
                        </p>
                    )}
                </div>

                {/* Priority */}
                <div className="space-y-1.5">
                    <label
                        htmlFor="priority"
                        className="block text-xs font-semibold text-slate-700"
                    >
                        Priority *
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <ShieldAlert className="w-4 h-4" />
                        </div>
                        <select
                            id="priority"
                            className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                                errors.priority
                                    ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                                    : "border-slate-200 focus:ring-purple-500/20 focus:border-purple-500"
                            }`}
                            {...register("priority")}
                        >
                            <option value="ESSENTIAL">Essential Need</option>
                            <option value="GOOD_TO_HAVE">Good to Have</option>
                            <option value="LUXURY">Luxury / Discretionary</option>
                        </select>
                    </div>
                    {errors.priority?.message && (
                        <p className="text-xs text-rose-500 font-medium">
                            {errors.priority.message}
                        </p>
                    )}
                </div>
            </div>

            {/* Date & Time Field */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <label
                        htmlFor="transactionDate"
                        className="block text-xs font-semibold text-slate-700"
                    >
                        Transaction Date
                    </label>
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={handleToday}
                            className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
                        >
                            Today
                        </button>
                        <button
                            type="button"
                            onClick={handleYesterday}
                            className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
                        >
                            Yesterday
                        </button>
                    </div>
                </div>

                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Calendar className="w-4 h-4" />
                    </div>
                    <input
                        id="transactionDate"
                        type="datetime-local"
                        className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                            errors.transactionDate
                                ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                                : "border-slate-200 focus:ring-purple-500/20 focus:border-purple-500"
                        }`}
                        {...register("transactionDate")}
                    />
                </div>
                {errors.transactionDate?.message && (
                    <p className="text-xs text-rose-500 font-medium">
                        {errors.transactionDate.message}
                    </p>
                )}
            </div>

            {/* Notes Field (Optional) */}
            <div className="space-y-1.5">
                <label
                    htmlFor="notes"
                    className="block text-xs font-semibold text-slate-700"
                >
                    Notes <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                    <div className="absolute top-3 left-3.5 pointer-events-none text-slate-400">
                        <FileText className="w-4 h-4" />
                    </div>
                    <textarea
                        id="notes"
                        rows={2}
                        placeholder="Add additional context or memo..."
                        className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                            errors.notes
                                ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                                : "border-slate-200 focus:ring-purple-500/20 focus:border-purple-500"
                        }`}
                        {...register("notes")}
                    />
                </div>
                {errors.notes?.message && (
                    <p className="text-xs text-rose-500 font-medium">
                        {errors.notes.message}
                    </p>
                )}
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="btn-interactive px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                    >
                        Cancel
                    </button>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-interactive px-5 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-purple-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting
                        ? isEditMode
                            ? "Saving..."
                            : "Adding..."
                        : isEditMode
                        ? "Save Changes"
                        : "Add Transaction"}
                </button>
            </div>
        </form>
    );
};

export default CreateTransactionForm;