// basically we defin ehat a transaction query looks like for our sql to work upon 

import { Category } from "../../generated/prisma/client";

export type TransactionOperation = // define the type of transaction we do 
    | "SUM"
    | "COUNT"
    | "LIST"
    | "MAX"
    | "MIN";

export interface TransactionQuery { // other paramasa for transacions 

    operation: TransactionOperation;

    category?: Category;

    startDate?: Date;

    endDate?: Date;
}