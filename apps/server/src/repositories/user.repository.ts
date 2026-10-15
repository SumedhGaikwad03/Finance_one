import { users } from "../data/users";
import { CreateUserInput , findUserSchema, updateUserInput } from "../schemas/user.schema";
import prisma from "../lib/prisma";

export type CreateUserData = { // this is an intrnal contract 
    name: string;
    email: string;
    passwordHash: string;
};
export const addUser = (user: CreateUserData) => {
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
    return prisma.user.create({
        data: {
            name: user.name,
            email: user.email.trim().toLowerCase(),
            passwordHash: user.passwordHash,
        },
    });
};

export const getAllUsers = () => {
    return prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            updatedAt: true,
        },
    });
};

export const findUserbyid = (id : number ) => {

return prisma.user.findUnique({ where :{ id ,} , }); // later we canadd more checks more parameters 

};
export const updateUserdata = (id : number , updates : updateUserInput) => {
// down the line we need to implement a second datbase check for race connditions 
   /*const userIndex = users.findIndex(user => user.id === id);

    users[userIndex] = {...users[userIndex],...updates,};
    
    return users[userIndex];*/
    const data = { ...updates };
    if (data.email) {
        data.email = data.email.trim().toLowerCase();
    }
    return prisma.user.update({where : {id}, data,});

};

export const updateUserPassword = (id: number, passwordHash: string) => {
    return prisma.user.update({
        where: { id },
        data: { passwordHash },
    });
};

export const deleteUser = ( id : number )=> {
    return prisma.user.delete({
    where: { id },
});

}

export const findUserbyEmail = (email: string) => {
    const normalized = email.trim().toLowerCase();
    return prisma.user.findFirst({
        where: {
            email: {
                equals: normalized,
                mode: "insensitive",
            },
        },
        orderBy: {
            id: "asc",
        },
    });
};