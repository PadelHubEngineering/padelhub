import { getModelForClass } from "@typegoose/typegoose";
import { Utente } from "./Utente";

class Cliente extends Utente {

    constructor(name: string, email: string, telefono: string) {
        super(name, email, telefono);
    }
}


export const UtenteModel = getModelForClass(Cliente)
