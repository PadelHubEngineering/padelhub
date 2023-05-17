import { prop, mongoose, Ref, modelOptions, DocumentType, getModelForClass } from "@typegoose/typegoose"
import { TipoAccount } from "./Utente"
import { Campo, Circolo , CircoloModel} from "./Circolo"
import { Partita } from "./Partita"
@modelOptions({ schemaOptions: { collection: 'PrenotazioneCampi' } })
export class PrenotazioneCampo {

    @prop({ required: true })
    public idCampo: number

    @prop({ required: true, ref: () => Circolo })
    public circolo: Ref<Circolo>

    @prop({ required: true })
    public dataPrenotazione: Date

    @prop({ required: true, ref: () => Partita})
    public partita: Ref<Partita>

    @prop({ required: true })
    public dataSlot: Date //data in cui lo slot è riservato

    //da salvare nel caso il circolo cambi orario, per il calcolo del range con numeroSlot
    @prop({ required: true })
    public orarioApertura: Date 

    //da salvare nel caso il circolo cambi orario, per il calcolo del range con numeroSlot
    @prop({ required: true })
    public orarioChiusura: Date

    //da salvare nel caso il circolo cambi orario, per il calcolo del range con numeroSlot
    @prop({ required: true })
    public durataSlot: number //in minuti



    constructor(numeroSlot: number, idCampo: number, circolo: Ref<Circolo>){
        this.idCampo = idCampo;
        this.circolo = circolo;
    }

    public async prenotazioneSlot(this: DocumentType<PrenotazioneCampo>, dataSlot: Date ,idCampo: number, circolo: Ref<Circolo>) {
        this.idCampo = idCampo;
        this.circolo = circolo;
        this.dataSlot = dataSlot;
        this.dataPrenotazione = new Date();
        
        await this.save()
    }
}

export const PrenotazioneCampoModel = getModelForClass(PrenotazioneCampo);
