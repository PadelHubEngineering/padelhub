import mongoose from "mongoose"
import {Circolo, CircoloModel} from "./Circolo"
import {Giocatore,GiocatoreModel} from "./Giocatore"
import {prop , getModelForClass, Ref, modelOptions} from "@typegoose/typegoose"

@modelOptions({
    schemaOptions : {
        timestamps : true 
    }
})
export class Partita{
    id_parita!: mongoose.Types.ObjectId;

    @prop({type : Boolean, default : false})
    isChiusa : boolean;

    @prop({type : Number , min : 0 , max : 24})
    n_slot : number

    @prop({type : Number , default : 0, max : 5})
    categoria_max : number

    @prop({type : Number , default : 0 , min : 0})
    categoria_min : number

    @prop({required : true , ref : () => Giocatore})
    giocatori : Ref<Giocatore>[];

    @prop({required : true , ref : () => Circolo})
    circolo : Ref<Circolo>

    @prop({required : true, min : 0 , max : 4})
    n_giocatori_prenotati : number

    constructor(giocatore : Ref<Giocatore> , n_slot : number , categoria_max : number , categoria_min : number , circolo : Ref<Circolo> ){
        this.giocatori.push(giocatore);
        this.n_slot = n_slot;
        this.categoria_max = categoria_max;
        this.categoria_min = this.categoria_min;
        this.circolo = circolo;
    }

    aggiungi_player(gioc : Ref<Giocatore>){
        if(!this.isChiusa){
            this.giocatori.push(gioc);
            this.n_giocatori_prenotati++;
            //aggiunta giocatore in database
            //creazione di prenotazione per giocatore
            if(this.n_giocatori_prenotati==4){
                this.isChiusa = true;

            }
        }
        

    }

    rimuovi_player(gioc : Ref<Giocatore>){
        if(this.giocatori.includes(gioc)){
            const index = this.giocatori.indexOf(gioc);
            this.giocatori.splice(index,1)
            this.n_giocatori_prenotati--;
            this.isChiusa=false;
            //rimozione giocatore da database
            //cancellazione prenotazione da database
        }
        

    }

    



}


export const PartitaModel = getModelForClass(Partita)

