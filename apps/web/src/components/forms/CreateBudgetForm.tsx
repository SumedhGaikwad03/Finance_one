// this is bughet form to create 

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
    createBudgetSchema,
    type CreateBudgetFormData,
} from "../../utils/budget.schema";

import { BUDGET_PERIODS } from "../../constants/budget.constants";

interface CreateBudgetFormProps {
    onSubmit: (data: CreateBudgetFormData) => void;
}

const CreateBudgetForm = ({
    onSubmit,
}: CreateBudgetFormProps) => {

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CreateBudgetFormData>({
        resolver: zodResolver(createBudgetSchema),
        defaultValues: {
            isLocked: false,
        },
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)}>

            <h2>Create Budget</h2>

            <div>
                <label>Amount</label>

                <input
                    type="number"
                    step="0.01"
                    {...register("amount", {
                        valueAsNumber: true,
                    })}
                />

                <p>{errors.amount?.message}</p>
            </div>


            <div>
                <label>Period</label>

                <select {...register("periodType")}>

                    <option value="">
                        Select period
                    </option>

                    {BUDGET_PERIODS.map((period) => (
                        <option
                            key={period}
                            value={period}
                        >
                            {period}
                        </option>
                    ))}

                </select>

                <p>{errors.periodType?.message}</p>
            </div>


            <div>
                <label>Start Date</label>

                <input
                    type="date"
                    {...register("startDate")}
                />

                <p>{errors.startDate?.message}</p>
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
                Create Budget
            </button>

        </form>
    );
};

export default CreateBudgetForm;