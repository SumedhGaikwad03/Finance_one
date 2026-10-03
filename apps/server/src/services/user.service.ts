
import bcrypt from "bcrypt";
import { CreateUserInput , updateUserInput, UpdateProfileInput, ChangePasswordInput } from "../schemas/user.schema";
import * as userRepository from "../repositories/user.repository";
import { ConflictError, NotFoundError, BadRequestError } from "../error/AppError";
import { isPrismaP2025 , isPrismaP2002 } from "../lib/prismaErrors"; // this layer is slighhty coupled 
// but its woth the trade
export const getAllUsers = () => {

  return userRepository.getAllUsers();
};

/*export const createUser = (user: CreateUserInput) => {
    return userRepository.addUser(user);
};*/

export const findUserbyId = async (id : number) => {
 const received_user = await userRepository.findUserbyid(id); 

 if(!received_user) { 

  throw new NotFoundError("user not found");
  
}
// no try catch block here cuz repo will reteun null here as its simply a absence of data not failure of operation 

return received_user;

};

export const updateUser =  async (id : number , updates : updateUserInput) => {

  const received_user = await userRepository.findUserbyid(id);

  if(!received_user){
    throw new NotFoundError("user not found");
  }

  try {

  return await userRepository.updateUserdata(id, updates); // this is essintally passing a promise to the controller 
  // and the controller will handle the promise and return the response to the client

   }
  catch(err){
    if(isPrismaP2025(err)){
      throw new NotFoundError("user not found");
    }
    else if (isPrismaP2002(err)){
      throw new ConflictError("email already exists");
    }

    throw (err); // swalling an error makes it genrealized in the flow of the system that makes it hard to debug later
    // this a good practicce to follow 
    
  }

}

export const deleteUser = async (id: number) => {

 const received_user = await userRepository.findUserbyid(id);

  if(!received_user){
    throw new NotFoundError("user not found");
  }

  try {
    return await userRepository.deleteUser(id);
}catch(err){
  if(isPrismaP2025(err)){
      throw new ConflictError("user not found");
    }
throw(err); // here we are chewing and digesting the error 




}
}

export const getCurrentUser = async (userId : number) => {

  const received_user = await userRepository.findUserbyid(userId);

  if(!received_user){
    throw new NotFoundError("user not found");
  } 

  return {
    id: received_user.id,
    name: received_user.name,
    email: received_user.email,
  };
};

export const updateProfile = async (userId: number, data: UpdateProfileInput) => {
  const user = await userRepository.findUserbyid(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  const updated = await userRepository.updateUserdata(userId, { name: data.name });
  return {
    id: updated.id,
    name: updated.name,
    email: updated.email,
  };
};

export const changeUserPassword = async (userId: number, input: ChangePasswordInput) => {
  const user = await userRepository.findUserbyid(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  const isMatch = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!isMatch) {
    throw new BadRequestError("Incorrect current password");
  }

  const passwordHash = await bcrypt.hash(input.newPassword, 10);
  await userRepository.updateUserPassword(userId, passwordHash);

  return {
    success: true,
    message: "Password updated successfully",
  };
};
  


