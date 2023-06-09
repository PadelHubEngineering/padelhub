import { logger } from "./logging";
import { Response } from "express";


export interface HTTPResponse {
    HTTPcode: number; 
    success: boolean;
} 
export interface HTTPResponseMessage extends HTTPResponse {
    message: string
}
export interface HTTPResponsePayload extends HTTPResponse {
    payload: object
}
export function sendHTTPResponse(res: Response, code: number, esito: boolean, payload: object): void;
export function sendHTTPResponse(res: Response, code: number, esito: boolean, msg: string): void;

export function sendHTTPResponse(res: Response, code: number, esito: any, payl: any){
    if(typeof payl === "string"){
        res.status(code).json({
            HTTPcode: code,
            success: esito,
            message: payl
        } as HTTPResponseMessage);
    }
    else if (typeof payl === "object"){
        res.status(code).json({
            HTTPcode: code,
            success: esito,
            payload: payl
        } as HTTPResponsePayload);
    }
    else{
        return false
    }
    return true
}

export function preliminary_check() {

    if ( process.env.SUPER_SECRET === undefined ) {
        logger.error("Impossibile caricare chiave privata, esco")
        return false
    }

    if ( process.env.MJ_APIKEY_PUBLIC === undefined ){
        logger.error("Impossibile caricare chiave pubblica di MailJet, esco")
        return false
    }

    if ( process.env.MJ_APIKEY_PRIVATE === undefined ){
        logger.error("Impossibile caricare chiave privata di MailJet, esco")
        return false
    }
    
    if(process.env.BING_MAP_KEY == undefined){
        logger.error("Impossibile caricare chiave privata di Bing Map, esco")
        return false
    }


    if ( process.env.CONFIRMATION_EMAIL_URL === undefined ){
        logger.error("Impossibile caricare url di base per l'email di conferma, esco")
        return false
    }

    if ( process.env.STRIPE_KEY === undefined){
        logger.error("Impossibile caricare la Stripe Key, esco")
        return false
    }
    return true
}
