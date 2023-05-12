import { prop, mongoose, Ref, modelOptions, DocumentType, getModelForClass } from "@typegoose/typegoose"
import { TipoAccount } from "./Utente"
import { Campo, Circolo , CircoloModel} from "./Circolo"

@modelOptions({ schemaOptions: { collection: 'PrenotazioneCampi' } })
export class PrenotazioneCampo {

    @prop({ required: true })
    public numeroSlot: number //Mi convince poco

    @prop({ required: true })
    public idCampo: number 

    @prop({ required: true, ref: () => Circolo })
    public circolo: Ref<Circolo>

    @prop({ required: true })
    public dataPrenotazione: Date

    @prop({ required: true })
    public tipoUtente: TipoAccount

    constructor(numeroSlot: number, idCampo: number, circolo: Ref<Circolo>){
        this.numeroSlot = numeroSlot;
        this.idCampo = idCampo;
        this.circolo = circolo;
    }

    public async prenotazioneSlot(this: DocumentType<PrenotazioneCampo>, numeroSlot: number, idCampo: number, circolo: Ref<Circolo>, tipoUtente: TipoAccount) {
        this.numeroSlot = numeroSlot;
        this.idCampo = idCampo;
        this.circolo = circolo;
        this.dataPrenotazione = new Date();
        this.tipoUtente = tipoUtente

        await this.save()
    }
}

export const PrenotazioneCampoModel = getModelForClass(PrenotazioneCampo);
