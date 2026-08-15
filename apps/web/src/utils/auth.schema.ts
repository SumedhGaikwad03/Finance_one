import { z } from "zod";

export const loginSchema = z.object({

    email: z
        .email("Please enter a valid email address."),

    password: z.string()
        .min(8, "Password must contain at least 8 characters."),

});

export type LoginFormData =
    z.infer<typeof loginSchema>; // here we kinda create the schema to use for runtime 

    // now we define register schema 

    export const registerSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Name is required")
        .max(50, "Name is too long"),

    email: z
        .string()
        .email("Invalid email address"),

    password: z
        .string()
        .min(8, "Password must be at least 8 characters"),
});

export type RegisterFormData = z.infer<
    typeof registerSchema
>;