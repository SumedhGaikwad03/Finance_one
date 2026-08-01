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

/*export class ValidationError extends AppError {
    constructor(message : string ) {
        super(message, 400); // this init the superclass that is apperror with the message and the status code 400 
    } // this plan is now dropped as we are not making another layer insted we leak a liitle zod into the middelware layer 
}*/ 

export class ConflictError extends AppError {
    constructor(message : string ) {
        super(message, 409); // this init the superclass that is apperror with the message and the status code 409 
    }}