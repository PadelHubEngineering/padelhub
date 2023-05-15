import { prop, mongoose, Ref, modelOptions, DocumentType, getModelForClass } from "@typegoose/typegoose"
import { TipoAccount } from "./Utente"
import { Campo, Circolo , CircoloModel} from "./Circolo"

@modelOptions({ schemaOptions: { collection: 'PrenotazioneCampi' } })
export class PrenotazioneCampo {

    @prop({ required: true })
    public numeroSlot: number

    @prop({ required: true })
    public idCampo: number

    @prop({ required: true, ref: () => Circolo })
    public circolo: Ref<Circolo>

    @prop({ required: true })
    public dataPrenotazione: Date

    @prop({ required: true })
    public tipoUtente: TipoAccount

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

    public getRangeByTimeSlot(numeroSlot: number): { inizioSlot: Date, fineSlot: Date } {
        var endTime = this.orarioChiusura.getTime()
        var startTime = this.orarioApertura.getTime()

        var inizioSlotMill = startTime + (numeroSlot* this.durataSlot) * 60 * 1000;
        var fineSlotMill = inizioSlotMill + this.durataSlot * 60 * 1000;

        if(inizioSlotMill > endTime || fineSlotMill > endTime) throw Error("Indice fuori range orario apertura/chiusura");

        return { inizioSlot: new Date(inizioSlotMill), fineSlot: new Date(fineSlotMill) }
    }

    constructor(numeroSlot: number, idCampo: number, circolo: Ref<Circolo>){
        this.numeroSlot = numeroSlot;
        this.idCampo = idCampo;
        this.circolo = circolo;
    }

    public async prenotazioneSlot(this: DocumentType<PrenotazioneCampo>, numeroSlot: number, dataSlot: Date ,idCampo: number, circolo: Ref<Circolo>, tipoUtente: TipoAccount) {
        this.numeroSlot = numeroSlot;
        this.idCampo = idCampo;
        this.circolo = circolo;
        this.dataSlot = dataSlot;
        this.dataPrenotazione = new Date();
        this.tipoUtente = tipoUtente 

        await this.save()
    }
}

export const PrenotazioneCampoModel = getModelForClass(PrenotazioneCampo);
