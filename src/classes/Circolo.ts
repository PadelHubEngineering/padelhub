import { getDiscriminatorModelForClass, getModelForClass, mongoose, prop, DocumentType, modelOptions } from "@typegoose/typegoose"
import { Utente, UtenteModel } from "./Utente"
import { TipoAccount } from "./Utente"
import { startSession } from "mongoose"
import { checkOnboarding } from "../utils/gestionePagamenti.utils"
import { PrenotazioneCampo, PrenotazioneCampoModel } from "./PrenotazioneCampo"
import { DateTime } from "luxon";
import { PrenotazioneModel } from "./PrenotazionePartita"


type DocumentoSocietario = { //TODO: meglio di così
    documento: string
}

export enum TipoCampo {
    Interno = "Interno",
    Esterno = "Esterno"
}

export enum GiornoSettimana {
    Lunedi,
    Martedi,
    Mercoledi,
    Giovedi,
    Venerdi,
    Sabato,
    Domenica
}

export class Campo {
    @prop({ required: true })
    public id: number

    @prop({ required: true })
    public tipologia: TipoCampo
}
export class OrarioGiornaliero {
    @prop({ required: true })
    public giorno: GiornoSettimana

    @prop({ required: true })
    public isAperto: boolean

    @prop({ required: true })
    public orarioApertura: Date = new Date(0, 0)

    @prop({ required: true })
    public orarioChiusura: Date = new Date(0, 0)

    public getOrarioApertura() {
        return `${this.orarioApertura.getHours()}:${this.orarioApertura.getMinutes()}:00`
    }

    public getOrarioChiusura() {
        return `${this.orarioChiusura.getHours()}:${this.orarioChiusura.getMinutes()}:00`
    }

    constructor(giorno: GiornoSettimana) {
        this.giorno = giorno;
        this.isAperto = false;
        this.orarioApertura = new Date(0, 0);
        this.orarioChiusura = new Date(0, 0)
    }
}


@modelOptions({ options: { allowMixed: 0 } })
export class Circolo extends Utente {

    _id: mongoose.Types.ObjectId;

    @prop()
    public indirizzo?: string

    @prop()
    public partitaIVA?: string

    @prop()
    public prezzoSlotOrario?: number

    @prop()
    public documentoSocietario: DocumentoSocietario

    @prop()
    public paymentOnboarding?: boolean = false

    @prop()
    public paymentId?: string

    @prop({ required: true })
    public validato: boolean = false

    @prop()
    public quotaAffiliazione?: number

    @prop()
    public scontoAffiliazione: number

    @prop({ default: [] })
    public campi: Campo[] = [];

    @prop()
    public durataSlot: number //in minuti

    @prop({ default: [] })
    public orarioSettimanale: OrarioGiornaliero[];

    @prop({ default: [] })
    public serviziAggiuntivi: string[] = [];
    // @prop({ type: () => [IscrizioneCircolo] })
    // public affiliati?: IscrizioneCircolo[] 

    

    public check_coerenza_dataInputSlot(this: DocumentType<Circolo>, date : Date){
        console.log(date)
        if(!date ){
            return false
        }
        const data_input : DateTime = DateTime.fromJSDate(date).setZone("Europe/Rome")
        if(!data_input){
            return false
        }
        try{
            var apertura = DateTime.fromJSDate(this.orarioSettimanale[data_input.weekday-1].orarioApertura)
            var chiusura = DateTime.fromJSDate(this.orarioSettimanale[data_input.weekday-1].orarioChiusura)
        }catch(err){
            return false
        }

        console.log(data_input.weekday-1)

        let i =0
        while(apertura < chiusura.minus({minutes: this.durataSlot})&& i++<24){
         
            if(apertura.hour == data_input.hour && apertura.minute == data_input.minute){
                return true
            }
            apertura= apertura.plus({minutes: this.durataSlot})
        }

        return false     
    }


    public isOpen(this: DocumentType<Circolo>, date : Date){
        if(!date ){
            return false
        }
        const data_input : DateTime = DateTime.fromJSDate(date).setZone("Europe/Rome")
        if(!data_input){
            return false
        }
        return this.orarioSettimanale[data_input.weekday-1].isAperto
    }


    public async isCampoAvaible(this: DocumentType<Circolo>, date : Date){
        const limite_inferiore = DateTime.fromJSDate(date).setZone("Europe/Rome") 
        const limite_superiore = limite_inferiore.plus({days:1})
        

        //const prenotazioni = await PrenotazioneModel.find()//{"circolo": this._id,"inizioSlot" : {"gte" : new Date(limite_inferiore.year,limite_inferiore.month,limite_inferiore.day), "lt" : new Date(limite_superiore.year,limite_superiore.month,limite_superiore.day)}})
        //console.log(prenotazioni)
    }





    public async setOrarioAperturaGiorno(this: DocumentType<Circolo>, giorno: GiornoSettimana, date: Date) {
        this.orarioSettimanale[giorno].orarioApertura = date
        this.markModified('orarioSettimanale')
        await this.save()
    }

    public async setOrarioChiusuraGiorno(this: DocumentType<Circolo>, giorno: GiornoSettimana, date: Date) {
        this.orarioSettimanale[giorno].orarioChiusura = date
        this.markModified('orarioSettimanale')
        await this.save()
    }

    public async setPaymentID(payID: string): Promise<Circolo> {
        this.paymentId = payID;
        await CircoloModel.findOneAndUpdate({ _id: this._id }, { paymentId: this.paymentId });
        return this
    }

    public async addCampo(this: DocumentType<Circolo>, tipoCampo: TipoCampo) {
        const id_campo = this.campi.length

        this.campi.push({ id: id_campo, tipologia: tipoCampo })
        this.markModified('campi')
        await this.save()

        return id_campo
    }

    public async isOnboarded(): Promise<boolean> {
        if (this.paymentId) {
            const res = (await checkOnboarding(this.paymentId))
            this.paymentOnboarding = res ? res : false;
            return this.paymentOnboarding;
        }
        return false;
    }

    public populateOrarioSettimanale() {
        this.orarioSettimanale = []
        Object.values(GiornoSettimana).filter((v) => !isNaN(Number(v))).forEach((val) => {
            this.orarioSettimanale.push(new OrarioGiornaliero(val as number))
        });
    }

    constructor(name: string, email: string, password: string, telefono?: string, partitaIVA?: string, prezzoSlotOrario?: number, paymentOnboarding?: boolean, quotaAffiliazione?: number, scontoAffiliazione?: number) {
        super(name, email, password, false, telefono)
        this.partitaIVA = partitaIVA
        this.prezzoSlotOrario = prezzoSlotOrario
        this.paymentOnboarding = paymentOnboarding
        this.validato = false
        this.quotaAffiliazione = quotaAffiliazione
        this.scontoAffiliazione = scontoAffiliazione ? scontoAffiliazione : 0;
        this.populateOrarioSettimanale()
    }

    getPrezzoSlotOrarioAffiliato(): number | undefined {
        if (this.prezzoSlotOrario) {
            return ((100 - this.scontoAffiliazione) * this.prezzoSlotOrario) / 100
        } 
        return this.prezzoSlotOrario
    }
}

export const CircoloModel = getDiscriminatorModelForClass(UtenteModel, Circolo, TipoAccount.Circolo);
