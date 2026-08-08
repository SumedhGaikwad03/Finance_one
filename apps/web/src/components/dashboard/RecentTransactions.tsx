import type { Transaction } from "../../types/dashboard.types";
import TransactionRow from "./TransactionRow";

// Props required for this component.
// We receive all the transactions that need to be displayed.
type RecentTransactionsProps = {

    transactions: Transaction[];

};

// This component is responsible for displaying
// the entire transactions table.
const RecentTransactions = ({

    transactions,

}: RecentTransactionsProps) => {

    return (

        <table>

            <thead>

                <tr>

                    <th>
                        Title
                    </th>

                    <th>
                        Category
                    </th>

                    <th>
                        Amount
                    </th>

                    <th>
                        Date
                    </th>

                </tr>

            </thead>

            <tbody>

                {/* Loop through every transaction and
                    create one TransactionRow component */}

                {transactions.map((transaction) => (
                 // it returns a component 
                    <TransactionRow

                        key={transaction.id}

                        transaction={transaction}

                    />

                ))}

            </tbody>

        </table>

    );

};

export default RecentTransactions;