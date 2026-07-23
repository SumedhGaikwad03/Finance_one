import {
    Request,
    Response,
    NextFunction,
    RequestHandler,
} from "express";

// A generic type representing any async controller.
//
// P        -> Route Params
// ResBody  -> Response Body
// ReqBody  -> Request Body
// ReqQuery -> Query Parameters
// Locals   -> res.locals type
type AsyncController<
    P,
    ResBody,
    ReqBody,
    ReqQuery,
    Locals extends Record<string, any>, // here we have defined the genrics 
> = (
    req: Request<
        P,
        ResBody,
        ReqBody,
        ReqQuery,
        Locals // we just use generics here that we defined above to define the types of the
        //  request and response objects in the controller function
    >,
    res: Response<
        ResBody,
        Locals
    >,
    next: NextFunction
) => Promise<void>;

export function asyncHandler<
    P,
    ResBody,
    ReqBody,
    ReqQuery,
    Locals extends Record<string, any>,
>(
    // controller is any async controller that follows the
    // AsyncController signature defined above.
    controller: AsyncController<
        P,
        ResBody,
        ReqBody,
        ReqQuery,
        Locals
    >
): RequestHandler< // this is the return type of the function, which is a RequestHandler with the
// same generic parameters as the controller
// as this async function anyways returns a function to the middleware which is a
// RequestHandler with the same generic parameters as the controller
    P,
    ResBody,
    ReqBody,
    ReqQuery,
    Locals
> {

    // This returned function is the actual middleware that Express stores.
    return (req, res, next) => {

        // Execute the controller.
        // If it throws or rejects, forward the error to Express.
        return controller(req, res, next).catch(next);
    };

}

/*
 version without generics

type AsyncController = (
    req: Request,
    res: Response,
    next: NextFunction
) => Promise<void>;

export function asyncHandler(
    controller: AsyncController
): RequestHandler {

    return (req, res, next) => {
        return controller(req, res, next).catch(next);
    };

}
*/