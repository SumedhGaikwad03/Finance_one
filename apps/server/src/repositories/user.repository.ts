import { users } from "../data/users";
import { CreateUserInput } from "../schemas/user.schema";

export const addUser = (user: CreateUserInput) => {
    const newUser = {
        id: users.length + 1,
        name: user.name,
        email: user.email,
    };

    users.push(newUser);

    return newUser;
};

export const getAllUsers = () => {
    return users;
};