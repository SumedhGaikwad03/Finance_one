import bcrypt from "bcrypt";

import { registerSchema , RegisterInput, LoginInput} from "../schemas/auth.schema";

import * as userRepository from "../repositories/user.repository";

import { ConflictError , UnauthorizedError } from "../error/AppError";
import { generateToken } from "../lib/jwt";

export const registerUser = async (user : RegisterInput) => {

    const existing_user = await userRepository.findUserbyEmail(user.email);

    if(existing_user){

        throw new ConflictError("email already exists");    }

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
    };


export const loginUser = async ( credentials: LoginInput) => {

const user = await userRepository.findUserbyEmail(credentials.email);

console.log("User:", user);

if ( ! user)
    throw new UnauthorizedError("Invaild email or password"); 

const isPasswordVaild = await bcrypt.compare(
 credentials.password,
  user.passwordHash); 

  console.log("Password Match:", isPasswordVaild);

if (!isPasswordVaild) {
    throw new UnauthorizedError("Invalid email or password");
}

const token = generateToken(user.id); 

return {
    token,
    user:{name: user.name, email: user.email, id: user.id}
}
}

    //this is our first response DTO 

