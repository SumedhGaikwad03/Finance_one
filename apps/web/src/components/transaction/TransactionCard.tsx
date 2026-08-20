import type { Transaction } from "../../types/dashboard.types";

interface TransactionCardProps {
    transaction: Transaction;
    onEdit: (transaction: Transaction) => void;
    onDelete: (id: number) => void; // when function accepts calls the delete function we dont return anything 
}

const TransactionCard = ({
    transaction, // this is a prop passed down from the main transaction page 
    onDelete, //card has acess to the delete function 
    onEdit,
}: TransactionCardProps) => {

    return (
        <article>

            <h3>
                {transaction.title ??
                    "Untitled Transaction"}
            </h3>

            <p>
                ₹{transaction.amount}
            </p>

            <p>
                {transaction.category}
            </p>

            <p>
                {transaction.priority}
            </p>

            <p>
                {transaction.transactionDate}
            </p>

            <button
    type="button"
    onClick={() => onEdit(transaction)}
>
    Edit
</button>

            <button
    type="button"
    onClick={() => onDelete(transaction.id)} 
>
    Delete
</button>

        </article>
    );
};

export default TransactionCard;