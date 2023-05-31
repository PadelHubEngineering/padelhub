import { Ref, getDiscriminatorModelForClass, getModelForClass, prop, mongoose, DocumentType } from "@typegoose/typegoose"
import { Circolo } from "./Circolo";
import { Utente, UtenteModel } from "./Utente";
import { TipoAccount } from "./Utente";
import { ObjectId } from "mongoose";
import { PrenotazionePartita } from "./PrenotazionePartita";

export enum Genere {
    Maschio = "maschio",
    Femmina = "femmina",
    Altro = "altro"
}

export class Giocatore extends Utente {

    _id: ObjectId;

    @prop({ required: true })
    public cognome: string

    @prop({ unique: true, required: true })
    public nickname: string

    @prop()
    public dataDiNascita?: Date

    @prop()
    public genere?: Genere

    @prop()
    public livello?: number

    @prop()
    public foto: string // È una stringa in base64

    @prop()
    public tagTelegram: string

    @prop({ ref: () => Circolo })
    public circoliAssociati: Ref<Circolo>[] = []; //Non va perchè manca la classe

    @prop({ ref: () => Giocatore })
    public preferiti: Ref<Giocatore>[] = [];

    // @prop({ type: () => PrenotazionePartita })
    // public partitePrenotate?: PrenotazionePartita[] = [];

    public calcolaCategoria(this: DocumentType<Giocatore>): number | null {

        if(
            this.livello === undefined ||
            this.livello < 0
        )
            return null;

        if ( this.livello < 1000 ) return 1
        else if ( this.livello < 2000 ) return 2
        else if( this.livello < 3000 ) return 3
        else if( this.livello < 4000 ) return 4
        else return 5
    }

    constructor(name: string, cognome: string, email: string, nickname: string, password: string, telefono?: string,  dataDiNascita?: Date, genere?: Genere, livello?: number) {
        super(name, email, password, false, telefono)
        this.nickname = nickname
        this.cognome = cognome
        this.dataDiNascita = dataDiNascita
        this.genere = genere
        this.livello = livello
    }

}
export const GiocatoreModel = getDiscriminatorModelForClass(UtenteModel, Giocatore, TipoAccount.Giocatore);



