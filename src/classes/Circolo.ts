import { getDiscriminatorModelForClass,mongoose, prop, DocumentType, modelOptions } from "@typegoose/typegoose"
import { Utente, UtenteModel } from "./Utente"
import { TipoAccount } from "./Utente"
import { startSession } from "mongoose"
import { checkOnboarding } from "../utils/gestionePagamenti.utils"
import { PrenotazioneCampo, PrenotazioneCampoModel } from "./PrenotazioneCampo"
import { DateTime, Interval } from "luxon";
import { PrenotazioneGiocatore } from "./PrenotazionePartita"
import { Giocatore, GiocatoreModel } from "./Giocatore"



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
    public orarioApertura: Date = new Date(0,0)

    @prop({ required: true }) 
    public orarioChiusura: Date = new Date(0,0)

    public getOrarioApertura() {
        return `${this.orarioApertura.getHours()}:${this.orarioApertura.getMinutes()}:00`
    }

    public getOrarioChiusura() {
        return `${this.orarioChiusura.getHours()}:${this.orarioChiusura.getMinutes()}:00`
    }

    constructor(giorno: GiornoSettimana) {
        this.giorno = giorno;
        this.isAperto = false;
        this.orarioApertura = new Date(0,0)
        this.orarioChiusura = new Date(0,0)
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
        if(!date ){
            return false
        }
        const data_input : DateTime = DateTime.fromJSDate(date).setZone('UTC+0')
        if(!data_input.isValid){
            return false
        }else if( data_input < DateTime.now().setZone("UTC+0")){
            return false
        }
        try{
            var apertura = DateTime.fromJSDate(this.orarioSettimanale[data_input.weekday-1].orarioApertura).setZone('UTC+0')
            var chiusura = DateTime.fromJSDate(this.orarioSettimanale[data_input.weekday-1].orarioChiusura).setZone('UTC+0')
        }catch(err){
            return false
        }

        const { day, month, year } = data_input;

        apertura = apertura.set({ day, month, year })
        chiusura = chiusura.set({ day, month, year })

        const interval = Interval.fromDateTimes( apertura , chiusura );
        const real_interval = interval.splitBy({ minutes: this.durataSlot })

        let ret = false;
        for( const inizio of real_interval ) {

            if( inizio.start?.equals(data_input))
                ret = true;
        }

        return ret
    }



    public isOpen(this: DocumentType<Circolo>, date : Date){
        if(!date ){
            return false
        }
        const data_input : DateTime = DateTime.fromJSDate(date).setZone("Europe/Rome")
        console.log(data_input)
        if(!data_input){
            return false
        }
        
        return this.orarioSettimanale[data_input.weekday-1].isAperto
    }


    public get_fineSlot(this: DocumentType<Circolo>, inizio_slot : Date){
        var inizio = DateTime.fromJSDate(inizio_slot).setZone("Europe/Rome")
        return inizio.plus({minute: this.durataSlot})

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

    isCircoloValidato( this: DocumentType<Circolo> ) {

        if( this.campi.length === 0 )
            return false;

        if( !this.partitaIVA || this.partitaIVA === "" )
            return false;

        if( !this.indirizzo || this.indirizzo === "" )
            return false;

        if( !this.orarioSettimanale.reduce( (acc, orario) => acc || orario.isAperto, false ) )
            return false;

        if( this.prezzoSlotOrario === undefined || this.prezzoSlotOrario <= 0 )
            return false;

        if( !this.quotaAffiliazione === undefined )
            return false;

        if( this.scontoAffiliazione === undefined )
            return false;

        if( this.durataSlot === undefined || this.durataSlot <= 0 )
            return false;

        return true;
    }
}

export const CircoloModel = getDiscriminatorModelForClass(UtenteModel, Circolo, TipoAccount.Circolo);
