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

export function controlloRegExp(res: Response, value: any, ok_empty: boolean, regExp: RegExp, error_message: string, value_name?: string) {

    if( !controlloStringa(res, value, ok_empty, error_message) ) return null;

    if( ! regExp.test(value as string)  ) {

        let msg = `${error_message}: ${ value_name || "Un valore inserito" } invalido`;

        sendHTTPResponse(res, 400, false, msg)
        return null;
    }
    return value as string;
}

export function controlloNomeCognome(res: Response, value: any, ok_empty: boolean, error_message: string, value_name?: string ) {

    if ( !controlloRegExp(
        res,
        value,
        ok_empty,
        /^[A-Za-z]{2,30}$/,
        error_message,
        value_name || "nome / cognome"
    ) )
        return null;

    else
        return value as string
}

export function controlloNickname(res: Response, value: any, ok_empty: boolean, error_message: string) {

    if ( !controlloRegExp(
        res,
        value,
        ok_empty,
        /^a-zA-Z0-9{6,18}[a-zA-Z0-9]$/,
        error_message,
        "Nickname"
    ) )
        return null;

    else
        return value as string
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

export function controlloInt(res: Response, value: any, minVal: number, maxVal: number, ok_borders: boolean, error_message: string, value_name?: string) {

    if (
        !value ||
        typeof value !== "number" ||
        ( ok_borders == false && minVal === value ) ||
        ( ok_borders == false && maxVal === value ) ||
        value < minVal ||
        value > maxVal
    ){
        let msg = `${error_message}: ${ value_name || "Un numero / valore inserito" } non e' valido`;

        sendHTTPResponse(res, 400, false, msg)
        return null
    }
    return value
}

export function controlloStrEnum(res: Response, value: any, enum_to_check: { [_: string]: string }, error_message: string, value_name?: string) {

    if ( !controlloStringa(res, value, false, error_message) ) return null;

    if ( ( value as string ) in enum_to_check ) {
        let msg = `${error_message}: ${ value_name || "Un numero / valore inserito" } non e' valido`;

        sendHTTPResponse(res, 400, false, msg)
        return null
    }
    return enum_to_check[value as string];
}
