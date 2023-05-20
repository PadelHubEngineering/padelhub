
import jwt from "jsonwebtoken"
import { TipoAccount } from "../classes/Utente";
import { Request, Response, NextFunction } from "express";
import { sendHTTPResponse } from "../utils/general.utils";

export type TokenAutenticazione = {
    // tokenEffettivo: string
    tipoAccount: TipoAccount
    nome: string
    email: string
}

declare global {
     namespace Express {
         interface Request {
             utenteAttuale?: TokenAutenticazione;
         }
     }
}

function checkJWT(token: string): null | TokenAutenticazione {
    // decode token, verifies secret and checks expiration
    try {
        const verified = jwt.verify(token, process.env.SUPER_SECRET!);

        if ( typeof verified === "string" )
            return null;

        return verified as TokenAutenticazione;
    } catch(err) {
        return null;
    }
}

function checkToken(req: Request, res: Response, next: NextFunction, account_richiesto: TipoAccount[] | null) {
    // header or url parameters or post parameters
    var token = req.body.token || req.query.token || req.headers['x-access-token'];


    if (!token) {
        res.status(401).json({
            success: false,
            message: 'Nessun token fornito'
        })
        return;
    }

    const decoded = checkJWT(token)

    if( decoded === null ){
        res.status(401).json({
            success: false,
            message: 'Il token fornito non è valido'
        })
        return
    }

    if(
        account_richiesto !== null &&
        !(account_richiesto.includes( decoded.tipoAccount ))
    ) {
        res.status(403).json({
            success: false,
            message: 'Non sei autorizzato ad accedere a questa risorsa'
        })
        return;
    }
    req.utenteAttuale = decoded;
    next();
};

export function checkTokenGiocatore(req: Request, res: Response, next: NextFunction) {
    checkToken(req, res, next, [ TipoAccount.Giocatore ])
}

export function checkTokenCircolo(req: Request, res: Response, next: NextFunction) {
    checkToken(req, res, next, [ TipoAccount.Circolo ])
}

export function checkTokenCustomerS(req: Request, res: Response, next: NextFunction) {
    checkToken(req, res, next, [ TipoAccount.OperatoreCustomerService ])
}
export function checkTokenAmministratore(req: Request, res: Response, next: NextFunction) {
    checkToken(req, res, next, [ TipoAccount.Amministratore ])
}

export function checkTokenGiocatoreOCircolo(req: Request, res: Response, next: NextFunction) {
    checkToken(req, res, next, [ TipoAccount.Giocatore, TipoAccount.Circolo ])
}
