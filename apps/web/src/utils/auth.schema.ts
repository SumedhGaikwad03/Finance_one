import { z } from "zod";

export const loginSchema = z.object({

    email: z
        .email("Please enter a valid email address."),

    password: z.string()
        .min(8, "Password must contain at least 8 characters."),

});

export type LoginFormData =
    z.infer<typeof loginSchema>; // here we kinda create the schema to use for runtime 