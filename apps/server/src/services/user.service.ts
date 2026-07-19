
import { CreateUserInput } from "../schemas/user.schema";
import * as userRepository from "../repositories/user.repository";

export const getAllUsers = () => {

  return userRepository.getAllUsers();
};

export const createUser = (user: CreateUserInput) => {
    return userRepository.addUser(user);
};