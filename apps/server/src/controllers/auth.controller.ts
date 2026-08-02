import {Request , Response , NextFunction} from "express";
import {registerSchema} from "../schemas/auth.schema";
import  {registerUser} from "../services/auth.service";

// we need not to import jwt or bycrypt here keeping the logic modular 

export async function register( 

req: Request ,
res: Response , 
next : NextFunction): Promise<void> {

const input = registerSchema.parse(req.body); 
// now results is checked by zod 

const user = await registerUser(input);
//this part saves the user data as intended 


res.status(201).json(user);

}