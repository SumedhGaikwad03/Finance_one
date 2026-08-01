import{Request , Response , NextFunction} from "express";
import { AppError } from "../error/AppError";
import{ZodError} from "zod";

export const errorMiddleware =( 
    err : Error ,
    req : Request ,
    res : Response ,
    next : NextFunction 
) => { 


    if ( err instanceof AppError) {
        return res.status(err.statusCode).json({message: err.message});
    }

    else if (err instanceof ZodError) {
        return res.status(400).json({message: "Vaildation failed " , errors : err.issues.map(issue => ({
            field : issue.path.join("."),
            message : issue.message,
        }))});
    } 

    //all tho we are leaking arch into erroe middle ware which makes the app zod dependent 
    // but its  a trade off we can make for the effort required to abstarct it 

    
    
    console.error(err);
    res.status(500).json({message : "Internal Server Error"});


}