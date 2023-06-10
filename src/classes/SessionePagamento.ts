import { Ref, index, prop, DocumentType, getModelForClass, modelOptions, ReturnModelType } from "@typegoose/typegoose"
import { PrenotazioneGiocatore } from "./PrenotazionePartita"
import mongoose, { mongo } from "mongoose"
import { add } from "winston"

@modelOptions({ schemaOptions: { collection: 'SessionePagamento' } })
export class SessionePagamento {

    @prop({ required: true })
    public idPagamento: string

    @prop({ ref: () => PrenotazioneGiocatore, required: true })
    public prenotazione: Ref<PrenotazioneGiocatore>

    @prop()
    public idIntent: string

    @prop()
    public idCharge: string

    public static async saveCodice(this: ReturnModelType<typeof SessionePagamento>, idPagamento: string, idPrenotazione: mongoose.Types.ObjectId) {
        return await this.create({ idPagamento: idPagamento, prenotazione: idPrenotazione })
    }
    public static async isValid(this: ReturnModelType<typeof SessionePagamento>, idPagamento: string) {
        return await this.findOne({ idPagamento: idPagamento })
    }
    public async addIntent(this: DocumentType<SessionePagamento>, idIntent: string) {
        this.idIntent = idIntent
        await this.save()
        return this
    }
    public async addCharge(this: DocumentType<SessionePagamento>, idCharge: string){
        this.idCharge = idCharge
        await this.save()
        return this
    }
}

export const SessionePagamentoModel = getModelForClass(SessionePagamento)
