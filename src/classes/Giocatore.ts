import { getModelForClass, prop } from "@typegoose/typegoose"
import { Utente } from "./Utente";
import { Circolo } from "./Circolo";

enum Genere { Maschio, Femmina, Altro}

export class Giocatore extends Utente{

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
    public foto?: HTMLImageElement //Controllare

    @prop()
    public tagTelegram?: string //Controllare

    @prop({ type: () => [Circolo] })
    public circoliAssociati?: Circolo[]; //Non va perchè manca la classe

    @prop({ type: () => [Giocatore] })
    public preferiti?: Giocatore[];

    @prop({ type: () => [Partita] })
    public partiteGiocate?: Partita[]; //Non va perchè manca la classe

    @prop({ type: () => [Partita] })
    public partitePrenotate?: Partita[]; //Non va perchè manca la classe


    constructor(name:string, email:string, telefono:string, nickname: string, dataDiNascita: Date, genere: Genere, livello: number) {
        super(name, email, telefono)
        this.nickname = nickname
        this.dataDiNascita = dataDiNascita
        this.genere = genere
        this.livello = livello
        this.confermato = false
    }


}

export const GiocatoreModel = getModelForClass(Giocatore)