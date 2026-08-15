// basically we defin ehat a transaction query looks like for our sql to work upon 

import { Category } from "../../generated/prisma/client";

export type TransactionOperation = // define the type of transaction we do as it restrics the varbles to these types 
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

// the differnce in tyoe and interfaces lies in the merging as only in the super power s they have as types can be 
// a list of choices and interface can merge we we define same of he two types 
// we use inter face for standar objects and type for list of options 