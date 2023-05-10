import { getDiscriminatorModelForClass, getModelForClass, mongoose, prop } from "@typegoose/typegoose"
import { Utente, UtenteModel } from "./Utente"
import { TipoAccount } from "./Utente"
type DocumentoSocietario = { //TODO: meglio di così
    documento: string
}

export enum TipoCampo{
    INTERNO = "INTERNO",
    ESTERNO = "ESTERNO"
}

export class Campo {
    public id: number
    public tipologia: TipoCampo
}

export class Circolo extends Utente {

    @prop()
    public indirizzo?: string

    @prop()
    public partitaIVA?: string

    @prop()
    public prezzoSlotOrario?: number

    @prop()
    public documentoSocietario?: DocumentoSocietario

    @prop()
    public paymentOnboarding?: boolean

    @prop({required: true})
    public validato: boolean = false

    @prop()
    public quotaAffiliazione?: number

    @prop()
    public scontoAffiliazione: number

    @prop()
    public campi?: mongoose.Types.Array<Campo>;
    // @prop({ type: () => [IscrizioneCircolo] })
    // public affiliati?: IscrizioneCircolo[] 

    constructor(name: string, email: string, password: string, telefono?: string, partitaIVA?: string, prezzoSlotOrario?: number, paymentOnboarding?: boolean, quotaAffiliazione?: number, scontoAffiliazione?: number) {
        super(name, email, password, telefono)
        this.partitaIVA = partitaIVA
        this.prezzoSlotOrario = prezzoSlotOrario
        this.paymentOnboarding = paymentOnboarding
        this.validato = false
        this.quotaAffiliazione = quotaAffiliazione
        this.scontoAffiliazione = scontoAffiliazione ? scontoAffiliazione : 0;
    }

    getPrezzoSlotOrarioAffiliato(): number | undefined {
        if(this.prezzoSlotOrario){
            return ((100 - this.scontoAffiliazione) * this.prezzoSlotOrario) / 100
        }
        return
    }



}

export const CircoloModel = getDiscriminatorModelForClass(UtenteModel, Circolo, TipoAccount.Circolo);
