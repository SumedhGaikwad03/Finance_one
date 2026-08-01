import bcrypt from "bcrypt";

import { registerSchema } from "../schemas/auth.schema";

import * as userRepository from "../repositories/user.repository";

import { ConflictError } from "../error/AppError";

export const registerUser = async (user : registerSchema) => {

    const existing_user = await userRepository.findUserbyEmail(user.email);

    if(existing_user){

        throw new ConflictError("email already exists");    

        const passwordHash = await bcrypt.hash(user.password, 10);

        const newUser = await userRepository.addUser({
            name: user.name,
            email: user.email,
            passwordHash
        });

        return {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email    
        };
    }};

    //this is our first response DTO 