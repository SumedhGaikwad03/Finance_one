import {z} from "zod";

export const registerSchema = z.object ({
name : z.string().trim().min(1 , "name is required ").max(50 , "name is too long "),
email : z.string().email("invalid email "),
password:z.string().min(8 , "password must be at least 8 characters long ")

})

export type registerSchema = z.infer <typeof registerSchema>;

export const loginSchema = z.object ({
email : z.string().email("invalid email "),
password:z.string().min(8 , "password must be at least 8 characters long ")
})

export type loginSchema = z.infer <typeof loginSchema>;