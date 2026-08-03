import {z} from "zod";
import {Category , Priority} from "../generated/prisma/enums";

export const createTransactionSchema = z.object({ // the is the schem that client sends for the backend 

    amount : z.number().positive("amount must be a positive number"),
    category : z.enum(Category), // this is the category that the user will select from the frontend and we will validate it here
 
    priority : z.enum(Priority), // this is the priority that the user will select from the frontend and we will validate it here
    title : z.string().trim().max(50 , "title is too long ").optional(),
    notes : z.string().trim().max(200 , "notes is too long ").optional(), // this is the notes that the user will enter from the frontend and we will validate it here
    transactionDate : z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date format" }).optional(), // this is the transaction date that the user will enter from the frontend and we will validate it here



})
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>; // this is the type that we will use in the service layer to validate the data that we get from the 
// controller and then we will pass it to the repository layer 


export const updateTransactionSchema = z.object({

   
    amount : z.number().positive("amount must be a positive number").optional(),
    category : z.enum(Category).optional(), // this is the category that the user will select from the frontend and we will validate it here
 
    priority : z.enum(Priority).optional(), // this is the priority that the user will select from the frontend and we will validate it here
    title : z.string().trim().max(50 , "title is too long ").optional(),
    notes : z.string().trim().max(200 , "notes is too long ").optional(), // this is the notes that the user will enter from the frontend and we will validate it here
    transactionDate : z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date format" }).optional()




}).refine( // this is used for cross field validation 
    (data) => Object.keys(data).length > 0 , 
    {
        message : "At least one field is required for an update."
    }
)
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>; 