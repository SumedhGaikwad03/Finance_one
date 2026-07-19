import { z } from "zod" ;  

export const createUserSchema = z.object({  // works at runtime , validates the data and throws an error if the data is invalid
 name: z.string().min(2).max(100),
 email: z.string().email(),

}); 
export type CreateUserInput = z.infer<typeof createUserSchema>; // at complie time for various function to know the type of
// data they are dealing with , this is a typescript type that is inferred from the zod schema