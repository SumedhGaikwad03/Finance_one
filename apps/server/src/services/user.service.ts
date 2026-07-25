
import { CreateUserInput , updateUserInput} from "../schemas/user.schema";
import * as userRepository from "../repositories/user.repository";
import { NotFoundError } from "../error/AppError";

export const getAllUsers = () => {

  return userRepository.getAllUsers();
};

export const createUser = (user: CreateUserInput) => {
    return userRepository.addUser(user);
};

export const findUserbyId = (id : number) => {
 const received_user = userRepository.findUserbyid(id); 

 if(!received_user) { 

  throw new NotFoundError("user not found");
  
}

return received_user;

};

export const updateUser = (id : number , updates : updateUserInput) => {

  const received_user = userRepository.findUserbyid(id);

  if(!received_user){
    throw new NotFoundError("user not found");
  }

  const user = userRepository.updateUserdata(id, updates);

  return user ; 

}

export const deleteUser =(id: number) => {

 const received_user = userRepository.findUserbyid(id);

  if(!received_user){
    throw new NotFoundError("user not found");
  }


 const user = userRepository.deleteUser(id);

return user ; }

  


