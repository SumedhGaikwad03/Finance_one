import {Request, Response, NextFunction} from "express"; 
import { verifyToken } from "../lib/jwt" ; 
import { UnauthorizedError } from "../error/AppError"; 



export function authMiddleware(req: Request, res: Response, next: NextFunction) {

    const authHeader = req.headers.authorization;  

    // at this point we are reading the auth header 

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new UnauthorizedError("Missing or invalid authorization header");
    }
    // thows errer if the erroe is wrong 

    const token = authHeader.split(" ")[1]; // extract the token from the header 
    try {
    const payload = verifyToken(token); 
    req.user = payload; // verify the token and get the payload 
    }
    catch (err) {
        throw new UnauthorizedError("Invalid token or expired token");
    }
    //req.user = payload; 
    console.log(req.user);

    next(); // call the next middleware or route handler 





}

