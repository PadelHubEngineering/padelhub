import { Ref, getModelForClass, prop } from "@typegoose/typegoose"
import { Giocatore } from "./Giocatore"
import { Circolo } from "./Circolo"
import mongoose from "mongoose"

export class IscrizioneCircolo {
    idIscrizione!: mongoose.Types.ObjectId;

    @prop({ required: true })
    quotaPagata: number

    @prop({ required: true })
    dataIscrizione: Date

    @prop({ ref: () => Giocatore, required: true })
    giocatore: Ref<Giocatore>

    @prop({ ref: () => Circolo, required: true })
    circolo: Ref<Circolo>

    constructor(quotaPagata: number, dataIscrizione: Date, giocatore: Ref<Giocatore>, circolo: Ref<Circolo>) {
        this.quotaPagata = quotaPagata;
        this.dataIscrizione = dataIscrizione;

        this.giocatore = giocatore;
        this.circolo = circolo
    }
}

export const IscrizioneCircoloModel = getModelForClass(IscrizioneCircolo)
