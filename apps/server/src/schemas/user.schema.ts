import { z } from "zod" ;  

export const createUserSchema = z.object({  // works at runtime , validates the data and throws an error if the data is invalid
 name: z.string().min(2).max(100),
 email: z.string().email(),

}); 
export type CreateUserInput = z.infer<typeof createUserSchema>; // at complie time for various function to know the type of
// data they are dealing with , this is a typescript type that is inferred from the zod schema

export const findUserSchema = z.object({
    id : z.coerce.number().int().positive(),
    
});
export type findUserInput = z.infer<typeof findUserSchema>;// for compile time type checking and validation of the data that is
// passed to the function

export const updateUserSchema = createUserSchema.partial().refine(

    (data)=> Object.keys(data).length > 0 , {message : "At least one field must be provided for update"} // datakeys rerun property names 
    // to compare th length form 9
); // this is a zod schema that is used to validate the data that is 
// passed to the update user function
export type updateUserInput = z.infer<typeof updateUserSchema>; // for compile time type checking and validation of the data that is