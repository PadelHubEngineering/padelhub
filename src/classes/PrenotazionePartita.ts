import {prop, getModelForClass, Ref} from "@typegoose/typegoose"
import {Circolo, CircoloModel} from "./Circolo"
import {Giocatore,GiocatoreModel} from "./Giocatore"
import {Partita,PartitaModel} from "./Partita"






export class Prenotazione{


    @prop({ required : true , type : Boolean , default : false})  //mongoose
    pagato : boolean //typescript
    

    @prop({ type : Number , default : 0 , min : 0 })
    cifra : number

    @prop({ required : true , ref: () => Partita})
    partita : Ref<Partita>


    constructor(){

    }




}



export const PrenotazioneModel = getModelForClass(Prenotazione)

