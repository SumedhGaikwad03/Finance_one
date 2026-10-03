import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IndianRupee, Calendar, Clock, Lock } from "lucide-react";

import {
    createBudgetSchema,
    type CreateBudgetFormData,
} from "../../utils/budget.schema";

import { BUDGET_PERIODS } from "../../constants/budget.constants";
import type { Budget } from "../../types/budget.types";

interface EditBudgetFormProps {
    budget: Budget;
    onSubmit: (data: CreateBudgetFormData) => void;
    onCancel: () => void;
    isSubmitting?: boolean;
}

const EditBudgetForm = ({
    budget,
    onSubmit,
    onCancel,
    isSubmitting = false,
}: EditBudgetFormProps) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CreateBudgetFormData>({
        resolver: zodResolver(createBudgetSchema),
        defaultValues: {
            amount: Number(budget.amount),
            periodType: budget.periodType,
            startDate: budget.startDate.slice(0, 10),
            isLocked: budget.isLocked,
        },
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Amount Field */}
            <div className="space-y-1.5">
                <label
                    htmlFor="edit-amount"
                    className="block text-xs font-semibold text-slate-700"
                >
                    Budget Limit Amount (₹)
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <IndianRupee className="w-4 h-4" />
                    </div>
                    <input
                        id="edit-amount"
                        type="number"
                        step="0.01"
                        placeholder="e.g. 25000"
                        className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                            errors.amount
                                ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                                : "border-slate-200 focus:ring-purple-500/20 focus:border-purple-500"
                        }`}
                        {...register("amount", {
                            valueAsNumber: true,
                        })}
                    />
                </div>
                {errors.amount?.message && (
                    <p className="text-xs text-rose-500 font-medium">
                        {errors.amount.message}
                    </p>
                )}
            </div>

            {/* Period Type Field */}
            <div className="space-y-1.5">
                <label
                    htmlFor="edit-periodType"
                    className="block text-xs font-semibold text-slate-700"
                >
                    Budget Period
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Clock className="w-4 h-4" />
                    </div>
                    <select
                        id="edit-periodType"
                        className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                            errors.periodType
                                ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                                : "border-slate-200 focus:ring-purple-500/20 focus:border-purple-500"
                        }`}
                        {...register("periodType")}
                    >
                        {BUDGET_PERIODS.map((period) => (
                            <option key={period} value={period}>
                                {period}
                            </option>
                        ))}
                    </select>
                </div>
                {errors.periodType?.message && (
                    <p className="text-xs text-rose-500 font-medium">
                        {errors.periodType.message}
                    </p>
                )}
            </div>

            {/* Start Date Field */}
            <div className="space-y-1.5">
                <label
                    htmlFor="edit-startDate"
                    className="block text-xs font-semibold text-slate-700"
                >
                    Effective Start Date
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Calendar className="w-4 h-4" />
                    </div>
                    <input
                        id="edit-startDate"
                        type="date"
                        className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                            errors.startDate
                                ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                                : "border-slate-200 focus:ring-purple-500/20 focus:border-purple-500"
                        }`}
                        {...register("startDate")}
                    />
                </div>
                {errors.startDate?.message && (
                    <p className="text-xs text-rose-500 font-medium">
                        {errors.startDate.message}
                    </p>
                )}
            </div>

            {/* Lock Budget Toggle */}
            <div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-2xl flex items-start gap-3">
                <input
                    id="edit-isLocked"
                    type="checkbox"
                    className="mt-0.5 w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
                    {...register("isLocked")}
                />
                <label htmlFor="edit-isLocked" className="text-xs space-y-0.5 cursor-pointer">
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-amber-700" />
                        Lock this budget
                    </span>
                    <p className="text-slate-500">
                        Locked budgets cannot be edited or deleted later to preserve accounting history.
                    </p>
                </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-purple-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? "Saving Changes..." : "Save Changes"}
                </button>
            </div>
        </form>
    );
};

export default EditBudgetForm;