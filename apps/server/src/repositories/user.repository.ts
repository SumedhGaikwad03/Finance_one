import { users } from "../data/users";
import { CreateUserInput , findUserSchema, updateUserInput } from "../schemas/user.schema";
import prisma from "../lib/prisma";
export const addUser = (user: CreateUserInput) => {
    /*const newUser = {
        id: users.length + 1,
        name: user.name,
        email: user.email,
    };

    users.push(newUser);

    return newUser;*/
   /* const newUser = {
        name: user.name,
        email: user.email,
    };*/
    return prisma.user.create({data :{name : user.name , email : user.email }}); // only pass usefull info form our schema to the 
    // the datanase as we need to loosely couple the prisma schema and zod schema 
};

export const getAllUsers = () => {
    return prisma.user.findMany();

};

export const findUserbyid = (id : number ) => {

return prisma.user.findUnique({ where :{ id ,} , }); // later we canadd more checks more parameters 

};
export const updateUserdata = (id : number , updates : updateUserInput) => {
// down the line we need to implement a second datbase check for race connditions 
   /*const userIndex = users.findIndex(user => user.id === id);

    users[userIndex] = {...users[userIndex],...updates,};
    
    return users[userIndex];*/

    return prisma.user.update({where : {id}, data : updates,});

};

export const deleteUser = ( id : number )=> {
const userIndex = users.findIndex(user => user.id === id );

const deletedUser = users.splice(userIndex,1);

return deletedUser[0];
}
