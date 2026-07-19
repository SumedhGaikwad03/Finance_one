import { Request, Response } from "express";
import { getAllUsers } from "../services/user.service";
import { createUser } from "../services/user.service";
import { createUserSchema } from "../schemas/user.schema";

export const getUsers = (
  req: Request,
  res: Response
): void => {
  const users = getAllUsers();

  res.json(users);
};

export const addUser =(
 req : Request,
 res : Response
) : void =>{

  const result = createUserSchema.safeParse(req.body); // result will be an object with success and data or error properties

  if(!result.success) {
      res.status(400).json(result.error.issues);
      return;
}

   const newUser = createUser(result.data);

 res.status(201).json(newUser);

} 

