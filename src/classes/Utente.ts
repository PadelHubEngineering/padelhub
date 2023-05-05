import { getModelForClass, prop } from "@typegoose/typegoose"

export class Utente {
    @prop({ required: true })
    public nome: string

    @prop({ required: true, index: true })
    public email: string

    @prop({ required: true })
    public telefono: string

    constructor( nome: string, email: string, telefono: string ) {
        this.nome = nome;
        this.email = email;
        this.telefono = telefono;
    }
}


export const UtenteModel = getModelForClass(Utente)
