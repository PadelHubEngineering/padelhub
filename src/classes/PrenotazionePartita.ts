import {prop, getModelForClass, Ref, DocumentType ,modelOptions} from "@typegoose/typegoose"
import {Circolo, CircoloModel} from "./Circolo"
import {Giocatore,GiocatoreModel} from "./Giocatore"
import {Partita,PartitaModel} from "./Partita"
import mongoose, { SchemaTypeOptions } from "mongoose"
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses"

@modelOptions({
    schemaOptions : {
        timestamps : true,
        collection : "PrenotazioniGiocatori"
    }
})
export class PrenotazioneGiocatore{
    id_prenotazione!: mongoose.Types.ObjectId;

    @prop({ required : false , type : Boolean })  //mongoose
    pagato : boolean = false//typescript
    

    @prop({ type : Number , default : 0 , min : 0 })
    costo : number

    @prop({ required : true , ref: () => Partita})
    partita : Ref<Partita>

    @prop({required : true , ref: () => Giocatore})
    giocatore : Ref<Giocatore>

    @prop({required :true})
    dataPrenotazione: Date

    constructor(cifra : number , partita : Ref<Partita> , data : Date, giocatore: Ref<Giocatore>){
        this.partita=partita;
        this.costo=cifra;
        this.pagato = false;
        this.dataPrenotazione=data
        this.giocatore= giocatore
    }

    
    //funz pagamento
    public async cancellaPrenotazione(this: DocumentType<PrenotazioneGiocatore>){
        if(!this.pagato){
            
            if(1){
                //se sono l'unico in partita, cancella anche partita

            }
            await this.deleteOne();
        }else{
            this.emissioneRimborso()
        }
    }

    public async pagaPrenotazione(this: DocumentType<PrenotazioneGiocatore>){
        if(!this.pagato){
            //STRIPE
            this.pagato = true

            await this.save()
        }
    }

    public emissioneRimborso(this: DocumentType<PrenotazioneGiocatore>){
        if(this.pagato){
            //servizio pagamento
        }

    }

}



export const PrenotazioneModel = getModelForClass(PrenotazioneGiocatore)

