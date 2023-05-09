import mongoose from "mongoose"
import {Circolo, CircoloModel} from "./Circolo"
import {Giocatore,GiocatoreModel} from "./Giocatore"
import {prop , getModelForClass, Ref} from "@typegoose/typegoose"


export class Partita{
    id_parita!: mongoose.Types.ObjectId;

    @prop({required : true , type : Boolean, default : false})
    chiusa : boolean;

    @prop({required : true , ref : () => Giocatore})
    giocatori : Ref<Giocatore>[];


    @prop({required : true , ref : () => Circolo})
    circolo : Ref<Circolo>

    constructor(){

    }

}


export const PartitaModel = getModelForClass(Partita)

