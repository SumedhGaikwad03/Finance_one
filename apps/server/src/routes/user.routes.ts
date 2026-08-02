import { Router } from "express";
import { finduser, getUsers,me,updateUserdata} from "../controllers/user.controller";
//import { addUser } from "../controllers/user.controller";
import { asyncHandler } from "../utils/asyncHandler";
//import { finduser } from "../controllers/user.controller";

import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authMiddleware, asyncHandler(getUsers)); // this call to controller which will call sevice and then finllly data 

//router.post("/addUser", asyncHandler(addUser)) ; this is redunandant now 

router.get("/:id", authMiddleware, asyncHandler(finduser))

router.patch("/:id", authMiddleware, asyncHandler(updateUserdata)); 




export default router;

//  now each of these routes are on track to be passed through the async controller as each  request may take long and
// and we should be able to handel async requests 
