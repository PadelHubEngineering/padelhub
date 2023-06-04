import { Ref, getDiscriminatorModelForClass, getModelForClass, prop, mongoose , DocumentType} from "@typegoose/typegoose"
import { Circolo, CircoloModel } from "./Circolo";
import { Utente, UtenteModel } from "./Utente";
import { TipoAccount } from "./Utente";
import { sendHTTPResponse } from "../utils/general.utils";
import { mongo } from "mongoose";

export enum Genere { Maschio, Femmina, Altro }

export class Giocatore extends Utente {

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

    @prop({ required: true })
    public confermato: boolean = false;

    @prop()
    public foto: string // È una stringa in base64

    @prop()
    public tagTelegram: string

    @prop({ ref: () => Circolo })
    public circoliAssociati: Ref<Circolo>[] = [];

    @prop({ ref: () => Giocatore })
    public preferiti: Ref<Giocatore>[] = [];

    // @prop({ type: () => [Partita] })
    // public partiteGiocate?: Partita[]; //Non va perchè manca la classe

    // @prop({ type: () => [Partita] })
    // public partitePrenotate?: Partita[]; //Non va perchè manca la classe

    constructor(name: string, cognome: string, email: string, nickname: string, password: string, telefono?: string,  dataDiNascita?: Date, genere?: Genere, livello?: number) {
        super(name, email, password, telefono)
        this.nickname = nickname
        this.cognome = cognome
        this.dataDiNascita = dataDiNascita
        this.genere = genere
        this.livello = livello
        this.confermato = false
    }

    public isAffiliato( circolo :Ref<Circolo>){
        if (this.circoliAssociati.includes(circolo)){
            return true
        }
        return false
    }



}
export const GiocatoreModel = getDiscriminatorModelForClass(UtenteModel, Giocatore, TipoAccount.Giocatore);



