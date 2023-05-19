import { prop, Ref, modelOptions, DocumentType, getModelForClass } from "@typegoose/typegoose"
import { Circolo } from "./Circolo"
import { Partita } from "./Partita"
import mongoose from "mongoose"

@modelOptions({ schemaOptions: { collection: 'PrenotazioneCampi' } })
export class PrenotazioneCampo {

    public _id!: mongoose.Types.ObjectId;

    @prop({ required: true })
    public idCampo: number

    @prop({ required: true, ref: () => Circolo })
    public circolo: Ref<Circolo>

    @prop({ required: true })
    public dataPrenotazione: Date

    @prop({ ref: () => Partita })
    public partita?: Ref<Partita>

    @prop({ required: true })
    public inizioSlot: Date //data e ora in cui lo slot è riservato

    @prop({ required: true })
    public fineSlot: Date //data e ora finale della prenotazione


    constructor(numeroSlot: number, idCampo: number, circolo: Ref<Circolo>) {
        this.idCampo = idCampo;
        this.circolo = circolo;
    }

    public async prenotazioneCircolo(
        this: DocumentType<PrenotazioneCampo>,
        inizioSlot: Date,
        fineSlot: Date,
        idCampo: number,
        circolo: Ref<Circolo>
    ) {
        this.idCampo = idCampo;
        this.circolo = circolo;
        this.inizioSlot = inizioSlot;
        this.fineSlot = fineSlot;
        this.dataPrenotazione = new Date();

        await this.save()
    }
}

export const PrenotazioneCampoModel = getModelForClass(PrenotazioneCampo);
