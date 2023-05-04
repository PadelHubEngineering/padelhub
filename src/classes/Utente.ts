import { getModelForClass, prop } from "@typegoose/typegoose"

export class Utente {
    @prop({ required: true })
    public name: string

    @prop({ required: true })
    public email: string

    @prop({ required: true })
    public telefono: string

    constructor( name: string, email: string, telefono: string ) {
        this.name = name;
        this.email = email;
        this.telefono = telefono;
    }
}


export const UtenteModel = getModelForClass(Utente)
