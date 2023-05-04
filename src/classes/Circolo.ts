import { getModelForClass, prop } from "@typegoose/typegoose"
import { Utente } from "./Utente";

export class Circolo extends Utente{

    constructor( name: string, email: string, telefono: string ) {
        super(name, email, telefono)
    }

}

export const CircoloModel = getModelForClass(Circolo)