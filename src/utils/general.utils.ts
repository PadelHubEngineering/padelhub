import { exitOnError } from "winston";
import { Circolo } from "../classes/Circolo";
import { Giocatore } from "../classes/Giocatore";
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

    return true
}