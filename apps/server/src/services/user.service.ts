import { users } from "../data/users";

export const getAllUsers = () => {
  return users;
};

export const createUser = (user : {name:string , email:string}) => {
    const newUser ={
        id: users.length+1,
        name:user.name,
        email:user.email,
        

    };
    users.push(newUser);
    console.log("New user created:", newUser); // Log the new user for debugging

    return newUser; // retruns the user created to the controller 

    

}