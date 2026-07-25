import { users } from "../data/users";
import { CreateUserInput , findUserSchema, updateUserInput } from "../schemas/user.schema";

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

export const findUserbyid = (id : number) => {

  return users.find(users => users.id === id);

  
};
export const updateUserdata = (id : number , updates : updateUserInput) => {
// down the line we need to implement a second datbase check for race connditions 
    const userIndex = users.findIndex(user => user.id === id);

    users[userIndex] = {...users[userIndex],...updates,};
    
    return users[userIndex];
}

export const deleteUser = ( id : number )=> {
const userIndex = users.findIndex(user => user.id === id );

const deletedUser = users.splice(userIndex,1);

return deletedUser[0];
}
