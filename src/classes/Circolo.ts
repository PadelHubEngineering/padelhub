import { getDiscriminatorModelForClass, getModelForClass, prop } from "@typegoose/typegoose"
import { Utente, UtenteModel } from "./Utente"
import { TipoAccount } from "../utils/general.utils"
type DocumentoSocietario = { //TODO: meglio di così
    documento: string
}

export class Circolo extends Utente {

    @prop({ required: true })
    public partitaIVA: string

    @prop({ required: true })
    public prezzoSlotOrario: number

    @prop({ required: true })
    public prezzoSlotOrarioAffiliato: number

    @prop()
    public documentoSocietario?: DocumentoSocietario

    @prop({ required: true })
    public paymentOnboarding: boolean

    @prop({ required: true })
    public validato: boolean

    @prop({ required: true })
    public quotaAffiliazione: number

    @prop({ required: true })
    public scontoAffiliazione: number

    // @prop({ type: () => [IscrizioneCircolo] })
    // public affiliati?: IscrizioneCircolo[] 

    constructor(name: string, email: string, telefono: string, password: string, partitaIVA: string, prezzoSlotOrario: number, paymentOnboarding: boolean, quotaAffiliazione: number, scontoAffiliazione: number) {
        super(name, email, telefono, password)
        this.partitaIVA = partitaIVA
        this.prezzoSlotOrario = prezzoSlotOrario
        this.paymentOnboarding = paymentOnboarding
        this.validato = false
        this.quotaAffiliazione = quotaAffiliazione
        this.scontoAffiliazione = scontoAffiliazione
        this.prezzoSlotOrarioAffiliato = ((100 - this.scontoAffiliazione) * prezzoSlotOrario) / 100

    }



}

export const CircoloModel = getDiscriminatorModelForClass(UtenteModel, Circolo, TipoAccount.Circolo);
