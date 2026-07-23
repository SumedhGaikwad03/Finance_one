import { Router } from "express";
import { finduser, getUsers } from "../controllers/user.controller";
import { addUser } from "../controllers/user.controller";
import { asyncHandler } from "../utils/asyncHandler";
//import { finduser } from "../controllers/user.controller";

const router = Router();

router.get("/", asyncHandler(getUsers)); // this call to controller which will call sevice and then finllly data 

router.post("/addUser", asyncHandler(addUser)) ; 

router.get("/:id", asyncHandler(finduser)) ; // this call to controller which will call sevice and then finllly data


export default router;

//  now each of these routes are on track to be passed through the async controller as each  request may take long and
// and we should be able to handel async requests 
