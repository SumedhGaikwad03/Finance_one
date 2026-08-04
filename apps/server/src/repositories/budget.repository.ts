import { BudgetPeriod, Prisma } from "../generated/prisma/client";
import prisma from "../lib/prisma";
import * as budgetSchema from "../schemas/budget.schema" ;

export type CreateBudgetData ={

    amount : Prisma.Decimal;
    periodType : BudgetPeriod;
    startDate : Date ;
    isLocked? : boolean;
    userId :    number ;
} 

export const createBudget =( budget : CreateBudgetData ) => {

    return prisma.budget.create({data : budget , });




};



export const findBudgetByUser = ( userId : number ) => {

    return prisma.budget.findMany({where : {userId}, orderBy : {startDate : "asc"} })
}



