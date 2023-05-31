import { getDiscriminatorModelForClass, getModelForClass, mongoose, prop, DocumentType, modelOptions } from "@typegoose/typegoose"
import { Utente, UtenteModel } from "./Utente"
import { TipoAccount } from "./Utente"
import { startSession } from "mongoose"
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
    }
}

export class ServizioAggiuntivo {
    @prop()
    public nomeServizio: string

    @prop()
    public descrizioneServizio: string

    constructor(nomeServizio: string, descrizioneServizio: string) {
        this.nomeServizio = nomeServizio;
        this.descrizioneServizio = descrizioneServizio;
    }
}

@modelOptions({ options: { allowMixed: 0 } })
export class Circolo extends Utente {

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
    public serviziAggiuntivi: ServizioAggiuntivo[] = [];
    // @prop({ type: () => [IscrizioneCircolo] })
    // public affiliati?: IscrizioneCircolo[] 

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

    public async addCampo(this: DocumentType<Circolo>, tipoCampo: TipoCampo) {
        const id_campo = this.campi.length

        this.campi.push({ id: id_campo, tipologia: tipoCampo })
        this.markModified('campi')
        await this.save()

        return id_campo
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
        return
    }
}

export const CircoloModel = getDiscriminatorModelForClass(UtenteModel, Circolo, TipoAccount.Circolo);
