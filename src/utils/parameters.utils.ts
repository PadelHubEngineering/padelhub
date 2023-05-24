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

export function controlloEmail(res:Response, value: any, error_message: string, value_name?: string){

    //Se non è una stringa e se è vuota
    if( !controlloStringa(res, value, false, error_message, value_name)) return null

    //Se l'email non rispetta il regex
    if(!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(value))){
        let msg = `${error_message}: ${ value_name || "L'email inserita" } non e' valida`;

        sendHTTPResponse(res, 400, false, msg)
        return null
    }
    
    //Controllo se l'email esiste già
    //Controllo se il nome del circolo esiste già
    return value as string

}

export function controlloTelefono(res:Response, value: any, error_message: string, value_name?: string){

    //Se non è una stringa e se è vuota 
    if( !controlloStringa(res, value, false, error_message, value_name)) return null

    //Se non rispetta il formato di un telephone number
    if(!(/^(3[0-9]{8,9})|(0{1}[1-9]{1,3})[\s|.|-]?(\d{4,})$/.test(value))){
        let msg = `${error_message}: ${ value_name || "numero di telefono inserito" } non valido`;

        sendHTTPResponse(res, 400, false, msg)
        return null        
    }

    return value as string;

}


export function controlloPassword(res:Response, value: any, error_message: string, value_name?: string){

    //Se non è una stringa e se è vuota 
    if( !controlloStringa(res, value, false, error_message, value_name)) return null

    //Controllo se rispetta il regex
    if( !(/^(?=.[a-z])(?=.[A-Z])(?=.\d)(?=.[@$!%?&])[A-Za-z\d@$!%?&]{8,}$/).test(value)){
        let msg = `${error_message}: ${ value_name || "La password inserita" } non valida`;

        sendHTTPResponse(res, 400, false, msg)
        return null  
    }

    return value as string;

}