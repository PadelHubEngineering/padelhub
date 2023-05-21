import { ErrorRequestHandler, Response, NextFunction, Request } from "express";
import { sendHTTPResponse } from "../utils/general.utils"


export function errorJsonHandler( error: ErrorRequestHandler, req: Request, res: Response, next: NextFunction ) {

    if( error instanceof SyntaxError ) {
        sendHTTPResponse( res, 400, false, "Richiesta malformata, impossibile leggere contenuto della richiesta")
    } else {
        next()
    }
}

export function notFoundErrorHandler( req: Request, res: Response, next: NextFunction ) {

    sendHTTPResponse( res, 404, false, "Impossibile trovare il dato o la risorsa richiesta")
}
