import {prop, getModelForClass, Ref, DocumentType ,modelOptions} from "@typegoose/typegoose"
import {Circolo, CircoloModel} from "./Circolo"
import {Giocatore,GiocatoreModel} from "./Giocatore"
import {Partita,PartitaModel} from "./Partita"
import mongoose, { SchemaTypeOptions } from "mongoose"
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses"

@modelOptions({
    schemaOptions : {
        timestamps : true,
        collection : "PrenotazioniPartita"
    },
    options: { allowMixed: 0 }
})
export class PrenotazionePartita{
    id_prenotazione!: mongoose.Types.ObjectId;

    @prop({ required : false , type : Boolean })  //mongoose
    pagato : boolean //typescript
    

    @prop({ type : Number , default : 0 , min : 0 })
    costo : number

    @prop({ required : true , ref: () => Partita})
    partita : Ref<Partita>

    @prop({ required: true, ref: () => Giocatore })
    giocatore: Ref<Giocatore>

    @prop()
    dataPrenotazione?: Date

    constructor(cifra : number , partita : Ref<Partita>, giocatore: Ref<Giocatore>, data : Date){
        this.partita=partita;
        this.costo=cifra;
        this.pagato = false;
        this.giocatore = giocatore;
        this.dataPrenotazione=data
    }

    
    //funz pagamento
    public async cancellaPrenotazione(this: DocumentType<PrenotazionePartita>){
        if(!this.pagato){
            
            if(1){
                //se sono l'unico in partita, cancella anche partita

            }
            await this.deleteOne();
            
        }else{
            this.emissioneRimborso()
        }
    }

    public async pagaPrenotazione(this: DocumentType<PrenotazionePartita>){
        if(!this.pagato){
            //STRIPE
            this.pagato = true

            await this.save()
        }
    }

    public emissioneRimborso(this: DocumentType<PrenotazionePartita>){
        if(this.pagato){
            //servizio pagamento
        }

    }
}

export const PrenotazionePartitaModel = getModelForClass(PrenotazionePartita)
