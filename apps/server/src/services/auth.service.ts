import bcrypt from "bcrypt";

import { registerSchema , RegisterInput, LoginInput} from "../schemas/auth.schema";

import * as userRepository from "../repositories/user.repository";

import { ConflictError , UnauthorizedError } from "../error/AppError";
import { generateToken } from "../lib/jwt";

export const registerUser = async (user : RegisterInput) => {
    const normalizedEmail = user.email.trim().toLowerCase();
    const existing_user = await userRepository.findUserbyEmail(normalizedEmail);

    if(existing_user){

        throw new ConflictError("email already exists");    }

        const passwordHash = await bcrypt.hash(user.password, 10);

        const newUser = await userRepository.addUser({
            name: user.name,
            email: normalizedEmail,
            passwordHash
        });

        return {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email    
        };
    };


export const loginUser = async ( credentials: LoginInput) => {
    const normalizedEmail = credentials.email.trim().toLowerCase();
    const user = await userRepository.findUserbyEmail(normalizedEmail);

    if (!user) {
        throw new UnauthorizedError("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(
        credentials.password,
        user.passwordHash
    );

    if (!isPasswordValid) {
        throw new UnauthorizedError("Invalid email or password");
    }

const token = generateToken(user.id); 

return {
    token,
    user:{name: user.name, email: user.email, id: user.id}
}
}

    //this is our first response DTO 

