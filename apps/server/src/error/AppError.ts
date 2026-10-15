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

export class BadRequestError extends AppError {
    constructor(message: string) {
        super(message, 400);
    }
}

export class ValidationError extends AppError {
    constructor(message: string) {
        super(message, 400);
    }
} 

export class ConflictError extends AppError {
    constructor(message : string ) {
        super(message, 409); // this init the superclass that is apperror with the message and the status code 409 
    }}

export class UnauthorizedError extends AppError {
    constructor(message : string ) {
        super(message , 401); // this init the superclass that is apperror with the message and the status code 401
    }
} 

export class TransactionNotFoundError extends AppError {
    constructor(message : string ) {
        super(message, 404); // this init the superclass that is apperror with the message and the status code 409 
    }
}

export class BudgetNotFoundError extends AppError {

    constructor(message :string) {
        super(message,404);
    }
} 

export class ForbiddenError extends AppError {
    constructor(message : string = "Forbidden") {
        super(message, 403);
    }
}

export class BudgetLockedError extends AppError {
    constructor(message :string = "Budget is locked and cannot be modified.") {
        super(message, 400);
    }
}
