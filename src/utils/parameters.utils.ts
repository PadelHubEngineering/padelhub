import { sendHTTPResponse } from "./general.utils";
import { Response } from "express"

export function controlloStringa(res: Response, value: any, ok_empty = false, error_message: string, value_name?: string){

    if ( !value || typeof value !== "string" || ( !ok_empty && value === "")){
        let msg = `${error_message}: ${ value_name || "Un valore inserito" } non e' valido`;

        sendHTTPResponse(res, 400, false, msg)
        return null
    }
    return value
}

export function controlloData(res: Response, value: any, error_message: string, value_name?: string){

    // @ts-expect-error
    if( !value || typeof(value) !== "string" || Date.parse(value) === NaN){
        let msg = `${error_message}: ${ value_name || "Una data inserita" } non e' valida`;

        sendHTTPResponse(res, 400, false, msg)
        return null
    }

    return new Date(value);
}
