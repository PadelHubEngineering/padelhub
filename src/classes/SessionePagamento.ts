import { Ref, index, prop, DocumentType, getModelForClass, modelOptions, ReturnModelType } from "@typegoose/typegoose"
import { PrenotazioneGiocatore } from "./PrenotazionePartita"
import mongoose, { mongo } from "mongoose"

@modelOptions({ schemaOptions: { collection: 'SessionePagamento' } })
export class SessionePagamento {

    @prop({ required: true })
    public idPagamento: string

    @prop({ref : () => PrenotazioneGiocatore, required: true })
    public prenotazione: Ref<PrenotazioneGiocatore>

    public static async saveCodice(this: ReturnModelType<typeof SessionePagamento>, idPagamento: string, idPrenotazione: mongoose.Types.ObjectId) {
        return await this.create({ idPagamento: idPagamento, prenotazione: idPrenotazione })
    }
    public static async isValid(this: ReturnModelType<typeof SessionePagamento>, idPagamento: string): Promise<boolean> {
        return await this.find({ idPagamento: idPagamento }) ? true : false
    }
}

export const SessionePagamentoModel = getModelForClass(SessionePagamento)
