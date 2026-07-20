export class AppError extends Error {

    statusCode : number;

    constructor(message : string , statusCode : number) {
        super(message);
        this.statusCode = statusCode;
}}


export class NotFoundError extends AppError {
    constructor(message : string ) {
        super(message, 404); // this init the superclass that is apperror with the message and the status code 404 

        
} }