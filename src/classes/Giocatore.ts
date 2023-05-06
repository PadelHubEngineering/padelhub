import { Ref, getModelForClass, prop } from "@typegoose/typegoose"
import { Circolo } from "./Circolo";
import { Utente } from "./Utente";

import { Genere } from "../utils/general.utils";

export class Giocatore extends Utente {

    @prop({ required:true })
    public nickname: string

    @prop({ required:true })
    public dataDiNascita: Date

    @prop({ required:true })
    public genere: Genere

    @prop({ required:true })
    public livello: number

    @prop()
    public confermato: boolean

    @prop()
    public foto?: string // È una stringa in base64

    @prop()
    public tagTelegram?: string

    @prop({ ref: () => Circolo })
    public circoliAssociati?: Ref<Circolo>[]; //Non va perchè manca la classe

    @prop({ ref: () => Giocatore })
    public preferiti?: Ref<Giocatore>[];

    // @prop({ type: () => [Partita] })
    // public partiteGiocate?: Partita[]; //Non va perchè manca la classe

    // @prop({ type: () => [Partita] })
    // public partitePrenotate?: Partita[]; //Non va perchè manca la classe


    constructor(name:string, email:string, telefono:string, nickname: string, dataDiNascita: Date, genere: Genere, livello: number, password: string) {
        super(name, email, telefono, password)
        this.nickname = nickname
        this.dataDiNascita = dataDiNascita
        this.genere = genere
        this.livello = livello
        this.confermato = false
    }

}

export const GiocatoreModel = getModelForClass(Giocatore)
