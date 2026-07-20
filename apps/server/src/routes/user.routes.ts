import { Router } from "express";
import { finduser, getUsers } from "../controllers/user.controller";
import { addUser } from "../controllers/user.controller";
//import { finduser } from "../controllers/user.controller";

const router = Router();

router.get("/", getUsers); // this call to controller which will call sevice and then finllly data 

router.post("/addUser", addUser) ; 

router.get("/:id", finduser) ; // this call to controller which will call sevice and then finllly data


export default router;