import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
    createBudgetSchema,
    type CreateBudgetFormData,
} from "../../utils/budget.schema";

import {
    BUDGET_PERIODS,
} from "../../constants/budget.constants";

import type { Budget } from "../../types/budget.types";

interface EditBudgetFormProps {
    budget: Budget;
    onSubmit: (data: CreateBudgetFormData) => void;
    onCancel: () => void;
}

const EditBudgetForm = ({
    budget,
    onSubmit,
    onCancel,
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
        <form onSubmit={handleSubmit(onSubmit)}>

            <h2>Edit Budget</h2>

            <div>
                <label>
                    Amount
                </label>

                <input
                    type="number"
                    step="0.01"
                    {...register("amount", {
                        valueAsNumber: true,
                    })}
                />

                <p>
                    {errors.amount?.message}
                </p>
            </div>


            <div>
                <label>
                    Period
                </label>

                <select
                    {...register("periodType")}
                >

                    {BUDGET_PERIODS.map((period) => (
                        <option
                            key={period}
                            value={period}
                        >
                            {period}
                        </option>
                    ))}

                </select>

                <p>
                    {errors.periodType?.message}
                </p>
            </div>


            <div>
                <label>
                    Start Date
                </label>

                <input
                    type="date"
                    {...register("startDate")}
                />

                <p>
                    {errors.startDate?.message}
                </p>
            </div>


            <div>
                <label>
                    <input
                        type="checkbox"
                        {...register("isLocked")}
                    />

                    Lock budget
                </label>
            </div>


            <button type="submit">
                Save Changes
            </button>

            <button
                type="button"
                onClick={onCancel}
            >
                Cancel
            </button>

        </form>
    );
};

export default EditBudgetForm;