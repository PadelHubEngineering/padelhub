import { getModelForClass } from "@typegoose/typegoose";
import { Utente } from "./Utente";

export class Cliente extends Utente {

    constructor(name: string, email: string, telefono: string) {
        super(name, email, telefono);
    }
}


export const ClienteModel = getModelForClass(Cliente)
