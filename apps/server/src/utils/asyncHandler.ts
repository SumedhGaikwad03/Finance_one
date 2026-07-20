import {
    Request,
    Response,
    NextFunction,
    RequestHandler,
   
} from "express";

type AsyncController<
    P,
    ResBody,
    ReqBody,
    ReqQuery,
    Locals extends Record<string, any>
> = (
    req: Request<
        P,
        ResBody,
        ReqBody,
        ReqQuery,
       Locals extends Record<string, any>,
    >,
    res: Response<
        ResBody,
       Locals extends Record<string, any>,
    >,
    next: NextFunction
) => Promise<void>;

export function asyncHandler<
    P,
    ResBody,
    ReqBody,
    ReqQuery,
    Locals
>(
    controller: AsyncController<P, ResBody, ReqBody, ReqQuery, Locals extends Record<string, any>>
): RequestHandler < // this is the return type of the function, which is a RequestHandler with the 
// same generic parameters as the controlleri \
// as this async fun anyways retuens a function to the midleware which is a 
// RequestHandler with the same generic parameters as the controller
    P,
    ResBody,
    ReqBody,
    ReqQuery,
   Locals extends Record<string, any>,
> {

    return (req, res, next) => {
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

} */ 