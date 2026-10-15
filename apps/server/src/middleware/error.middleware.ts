import { Request, Response, NextFunction } from "express";
import { AppError } from "../error/AppError";
import { ZodError } from "zod";
import { isPrismaP2002, isPrismaP2025 } from "../lib/prismaErrors";

export const errorMiddleware = ( 
    err : Error ,
    req : Request ,
    res : Response ,
    next : NextFunction 
) => { 
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({message: err.message});
    }

    else if (err instanceof ZodError) {
        return res.status(400).json({message: "Validation failed" , errors : err.issues.map(issue => ({
            field : issue.path.join("."),
            message : issue.message,
        }))});
    } 

    else if (isPrismaP2002(err)) {
        return res.status(409).json({ message: "Resource already exists or unique constraint violated" });
    }

    else if (isPrismaP2025(err)) {
        return res.status(404).json({ message: "Resource not found" });
    } 

    //all tho we are leaking arch into erroe middle ware which makes the app zod dependent 
    // but its  a trade off we can make for the effort required to abstarct it 

    
    
    console.error(err);
    res.status(500).json({message : "Internal Server Error"});


}