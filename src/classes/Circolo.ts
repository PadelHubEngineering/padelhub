import { getModelForClass, prop } from "@typegoose/typegoose"
import { Utente } from "./Utente"

export class Circolo extends Utente{

    @prop({ required:true })
    public partitaIVA: string

    @prop({ required:true })
    public prezzoSlotOrario: number

    @prop({ required:true })
    public prezzoSlotOrarioAffiliato: number

    @prop({ required:true })
    public documentoSocietario: Document

    @prop({ required:true })
    public paymentOnboarding: boolean

    @prop({ required:true })
    public validato: boolean

    @prop({ required:true })
    public quotaAffiliazione: number

    @prop({ required:true })
    public scontoAffiliazione: number

    // @prop({ type: () => [IscrizioneCircolo] })
    // public affiliati?: IscrizioneCircolo[] 

    constructor(name:string, email:string, telefono:string, partitaIVA: string, prezzoSlotOrario: number, documentoSocietario: Document, paymentOnboarding: boolean, quotaAffiliazione: number ,scontoAffiliazione: number ) {
        super(name, email, telefono)
        this.partitaIVA = partitaIVA
        this.prezzoSlotOrario = prezzoSlotOrario
        this.documentoSocietario = documentoSocietario
        this.paymentOnboarding = paymentOnboarding
        this.validato = false 
        this.quotaAffiliazione = quotaAffiliazione
        this.scontoAffiliazione = scontoAffiliazione
        this.prezzoSlotOrarioAffiliato = ((100-this.scontoAffiliazione)*prezzoSlotOrario)/100
        
    }

    

}

export const CircoloModel = getModelForClass(Circolo)