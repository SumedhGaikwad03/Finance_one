import { Request, Response } from "express";
import {
  getAllUsers,
  updateUser,
  deleteUser,
  getCurrentUser,
  updateProfile,
  changeUserPassword,
  findUserbyId,
} from "../services/user.service";
import {
  findUserSchema,
  updateUserSchema,
  updateProfileSchema,
  changePasswordSchema,
} from "../schemas/user.schema";
import { ForbiddenError } from "../error/AppError";
import { NextFunction } from "express";

export async function getUsers (
  req: Request,
  res: Response,
  next : NextFunction,
): Promise<void>  {
  const currentUser = await getCurrentUser(req.user.userId);
  res.status(200).json([currentUser]);
};

export async function findUser (
  req :Request ,
  res :Response ,
  next : NextFunction
) : Promise<void> {
 const {id} = findUserSchema.parse(req.params);
 if (req.user.userId !== id) {
   throw new ForbiddenError("Access denied: You cannot view other user profiles");
 }
 const user  = await findUserbyId(id);
 res.status(200).json(user);
}

export async function updateUserdata (
  req : Request ,
  res : Response ,
  next : NextFunction
) : Promise<void> { 
  const {id} = findUserSchema.parse(req.params);
  if (req.user.userId !== id) {
    throw new ForbiddenError("Access denied: You cannot update other user accounts");
  }
  const updates = updateUserSchema.parse(req.body); 
  const user = await updateUser(id,updates);
  res.status(200).json(user);
}

export async function deleteUserData ( 
  req: Request ,
  res : Response,
  next : NextFunction
) :Promise<void> {
  const {id} = findUserSchema.parse(req.params);
  if (req.user.userId !== id) {
    throw new ForbiddenError("Access denied: You cannot delete other user accounts");
  }
  const user = await deleteUser(id);
  res.status(200).json(user);
}

export async function me (
  req : Request ,
  res : Response ,
  next : NextFunction
) : Promise<void> {
  const userId = req.user.userId;
  const responseUser = await getCurrentUser(userId);
  res.status(200).json({user: responseUser});
}

export async function updateCurrentUser (
  req : Request ,
  res : Response ,
  next : NextFunction
) : Promise<void> {
  const userId = req.user.userId;
  const updates = updateProfileSchema.parse(req.body);
  const updatedUser = await updateProfile(userId, updates);
  res.status(200).json({user: updatedUser, message: "Profile updated successfully"});
}

export async function changePassword (
  req : Request ,
  res : Response ,
  next : NextFunction
) : Promise<void> {
  const userId = req.user.userId;
  const data = changePasswordSchema.parse(req.body);
  const result = await changeUserPassword(userId, data);
  res.status(200).json(result);
}


