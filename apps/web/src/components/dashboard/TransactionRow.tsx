import type { Transaction } from "../../types/dashboard.types";

// Props required to render one transaction row.
type TransactionRowProps = {

    transaction: Transaction;

};

// Displays a single transaction inside the table.
const TransactionRow = ({

    transaction,

}: TransactionRowProps) => {

    return (

        <tr>

            <td>
                {transaction.title}
            </td>

            <td>
                {transaction.category}
            </td>

            <td>
                ₹{transaction.amount}
            </td>

            <td>
                {transaction.transactionDate}
            </td>

        </tr>

    );

};

export default TransactionRow;