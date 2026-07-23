import { Request, Response } from "express";
import { getAllUsers } from "../services/user.service";
import { createUser } from "../services/user.service";
import { findUserbyId } from "../services/user.service";
import { createUserSchema } from "../schemas/user.schema";
import { NextFunction } from "express";

export async function getUsers (
  req: Request,
  res: Response,
  next : NextFunction,
): Promise<void>  {
  const users = getAllUsers();

  res.status(200).json(users);
};

export async function addUser (
 req : Request,
 res : Response,
 next : NextFunction,
) : Promise<void> {

  const result = createUserSchema.safeParse(req.body); // result will be an object with success and data or error properties

  if(!result.success) {
      res.status(400).json(result.error.issues);
      return;
}

   const newUser = createUser(result.data);

 res.status(201).json(newUser);

} 

export async function  finduser (
  req :Request ,
  res :Response ,
  next : NextFunction

) : Promise<void> {

const user_received = findUserbyId(Number(req.params.id));

res.status(200).json(user_received);


}


