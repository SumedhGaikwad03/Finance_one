import {z} from "zod";

export const registerSchema = z.object ({ // tthis is runtime object that will vaildate the data 
name : z.string().trim().min(1 , "name is required ").max(50 , "name is too long "),
email : z.string().email("invalid email "),
password:z.string().min(8 , "password must be at least 8 characters long ")

})

export type RegisterInput = z.infer <typeof registerSchema>; // when ts complies it disappers 

export const loginSchema = z.object ({
email : z.string().email("invalid email "),
password:z.string().min(8 , "password must be at least 8 characters long")
})

export type LoginInput = z.infer <typeof loginSchema>;