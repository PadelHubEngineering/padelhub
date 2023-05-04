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

    @prop({ required: true })
    giocatore: Ref<Giocatore>

    @prop({ required: true })
    circolo: Ref<Circolo>

    constructor(quotaPagata: number, dataIscrizione: Date) {
        this.quotaPagata = quotaPagata;
        this.dataIscrizione = dataIscrizione;
    }
}

export const IscrizioneCircoloModel = getModelForClass(IscrizioneCircolo)
