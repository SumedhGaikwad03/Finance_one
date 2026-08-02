import "express"; 

declare global {
    namespace Express {
        interface Request {
            user : {
            userId : number; // this is the user id that we will get from the jwt token and we will use it in the 
            // controllers to get the user data from the database 

            // now only this could be a request for the backend 
        }}

    }
}

export {};