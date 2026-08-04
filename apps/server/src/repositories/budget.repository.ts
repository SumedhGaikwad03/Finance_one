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
    // this is user at more than one instance on our code 

    return prisma.budget.findMany({where : {userId}, orderBy : {startDate : "asc"} })
}

export const updateBudget = ( id : number  , input : budgetSchema.UpdateBudgetInput) => {

    return prisma.budget.update({where : {id : id} , data : input  })
}

export const findBudgetById = (id: number) => {

    return prisma.budget.findUnique({
        where: { id }
    });

}

export const deleteBudget = ( id : number ) => {

    return prisma.budget.delete({where : {id}}); 
}



