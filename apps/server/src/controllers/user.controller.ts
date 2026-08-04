import { Request, Response } from "express";
import { getAllUsers, updateUser , deleteUser, getCurrentUser} from "../services/user.service";
//import { createUser } from "../services/user.service";
import { findUserbyId } from "../services/user.service";
import { createUserSchema , findUserSchema , updateUserSchema} from "../schemas/user.schema";
import { NextFunction } from "express";

export async function getUsers (
  req: Request,
  res: Response,
  next : NextFunction,
): Promise<void>  {
  const users = await getAllUsers();
  console.log(req.user);

  res.status(200).json(users);
};

/*export async function addUser (
 req : Request,
 res : Response,
 next : NextFunction,
) : Promise<void> {

  const result = createUserSchema.parse(req.body); // result will be an not be an object with success and data or error properties

  

   const newUser = await createUser(result);

 res.status(201).json(newUser);
 // this is now redundnadn as we use seprate routes for auth and everyoyher things 
} */

export async function  findUser (
  req :Request ,
  res :Response ,
  next : NextFunction

) : Promise<void> {

 const {id} = findUserSchema.parse(req.params) // as the {id } take id property form the object returned by the parse 
 // method of the findUserSchema object which is a zod schema object and then we can use this id to find the user in the 
 // database or in this case in the users array


const user  = await findUserbyId(id);

res.status(200).json(user);


}

export async function updateUserdata (
  req : Request ,
  res : Response ,
  next : NextFunction
) : Promise<void> { 

  const {id} = findUserSchema.parse(req.params); // checks validation of parameters as id via zod schema

  const updates = updateUserSchema.parse(req.body); 

  const user = await updateUser(id,updates);

  res.status(200).json(user);


}

export async function deleteUserData ( 
req: Request ,
res : Response,
next : NextFunction ) :Promise<void> {

const {id} = findUserSchema.parse(req.params);

const user = await deleteUser(id);

res.status(200).json(user)}

export async function me (
  req : Request ,
  res : Response ,
  next : NextFunction
) : Promise<void> {

  const user = req.user.userId; // this is the user id that we have set in the auth middleware after verifying the token and then we can use this user id to find the user in the database or in this case in the users array
   const reponseUser = await getCurrentUser(user);
  res.status(200).json({user: reponseUser});
}


