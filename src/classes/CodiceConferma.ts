import { Ref, index, prop, DocumentType, getModelForClass, modelOptions } from "@typegoose/typegoose"
import { Utente } from "./Utente"
import { ObjectId } from "mongoose";
import { Circolo } from "./Circolo";
import { Giocatore } from "./Giocatore";

@modelOptions({ schemaOptions: { collection: 'CodiceConferma' } })
export class CodiceConferma {

    public _id: ObjectId

    @prop({ ref: () => Utente, required: true })
    public utente?: Ref<Utente> | Ref<Giocatore> | Ref<Circolo>

    constructor(utente: Ref<Utente> | Ref<Giocatore> | Ref<Circolo>) {
        this.utente = utente;
    }
}

export const CodiceConfermaModel = getModelForClass(CodiceConferma)
