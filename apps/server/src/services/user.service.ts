
import { CreateUserInput , updateUserInput} from "../schemas/user.schema";
import * as userRepository from "../repositories/user.repository";
import { NotFoundError } from "../error/AppError";
import { isPrismaP2025 } from "../lib/prismaErrors";
export const getAllUsers = () => {

  return userRepository.getAllUsers();
};

export const createUser = (user: CreateUserInput) => {
    return userRepository.addUser(user);
};

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
      throw new NotFoundError("user not found");
    }
throw(err); // here we are chewing and digesting the error 




}
}
  


