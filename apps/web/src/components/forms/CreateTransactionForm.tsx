import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
    createTransactionSchema,
    type CreateTransactionFormData,
} from "../../utils/transaction.schema"; // we import this as a type as its a compile time import and it helps us catch errors before anything 
// in the app crashs at runtime 

interface CreateTransactionFormProps {
    onSubmit: (data: CreateTransactionFormData) => void;
}
// here anyone using the the create transaction  props  must use an onsubmit function which will receive vaildated data 

const CreateTransactionForm = ({
    onSubmit,
}: CreateTransactionFormProps) => {

    const {
        register, // this is an function that bypasses the use of react states as insted of react using its native memory it uses 
        // the memeory of the browser as the browers remebers what input the user has provided 
        handleSubmit,
        formState: { errors },
    } = useForm<CreateTransactionFormData>({ // our react that what type of data or shape of data we expect here 
        resolver: zodResolver(createTransactionSchema),// is used to check if the user has enterd validated data 
    });
 // below is just the frontnd stuff that renders the from 
    return (

        
        <form onSubmit={handleSubmit(onSubmit)}>

            <h2>Add Transaction</h2>

            <div>
                <label>Amount</label>

                <input
                    type="number"
                    step="0.01" //this tells browser how to restrict the user input 
                    {...register("amount", { // the register part crates hidden input event listners manages all the sates and react hook form
                        //can track the data under name amount 
                        valueAsNumber: true, // froces the browser to convert every browser to a string 
                    })}
                />

                <p>{errors.amount?.message}</p>
            </div>

            <div>
                <label>Category</label>

                <select {...register("category")}>

                    <option value="">
                        Select category
                    </option>

                    <option value="FOOD">Food</option>
                    <option value="FUEL">Fuel</option>
                    <option value="SHOPPING">Shopping</option>
                    <option value="BILLS">Bills</option>
                    <option value="ENTERTAINMENT">
                        Entertainment
                    </option>
                    <option value="HEALTH">Health</option>
                    <option value="TRAVEL">Travel</option>
                    <option value="EDUCATION">Education</option>
                    <option value="SUBSCRIPTION">
                        Subscription
                    </option>
                    <option value="GIFT">Gift</option>
                    <option value="OTHER">Other</option>

                </select>

                <p>{errors.category?.message}</p>
            </div>

            <div>
                <label>Priority</label>

                <select {...register("priority")}>

                    <option value="">
                        Select priority
                    </option>

                    <option value="ESSENTIAL">
                        Essential
                    </option>

                    <option value="GOOD_TO_HAVE">
                        Good to have
                    </option>

                    <option value="LUXURY">
                        Luxury
                    </option>

                </select>

                <p>{errors.priority?.message}</p>
            </div>

            <div>
                <label>Title</label>

                <input
                    type="text"
                    {...register("title")}
                />

                <p>{errors.title?.message}</p>
            </div>

            <div>
                <label>Notes</label>

                <textarea
                    {...register("notes")}
                />

                <p>{errors.notes?.message}</p>
            </div>

            <div>
                <label>Transaction Date</label>

                <input
                    type="datetime-local"
                    {...register("transactionDate")}
                />

                <p>{errors.transactionDate?.message}</p>
            </div>

            <button type="submit">
                Add Transaction
            </button>

        </form>
    );
};

export default CreateTransactionForm;