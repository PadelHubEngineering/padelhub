import { prop, mongoose, Ref } from "@typegoose/typegoose"
import { TipoAccount } from "./Utente"
import { Circolo , CircoloModel} from "./Circolo"

export class PrenotazioneCampo {
    @prop({ required: true, unique: true })
    public idPrenotazioneCampo: string

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
}