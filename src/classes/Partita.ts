import mongoose from "mongoose"
import {Circolo, CircoloModel} from "./Circolo"
import {Giocatore,GiocatoreModel} from "./Giocatore"
import {Prenotazione} from "./PrenotazionePartita"
import {prop, getModelForClass, Ref, DocumentType , modelOptions, post,pre} from "@typegoose/typegoose"
import { NamedExportBindings } from "typescript"
import { NextFunction , Request ,Response } from "express"
import { sendHTTPResponse, HTTPResponse } from "../utils/general.utils"

@modelOptions({
    schemaOptions : {
        timestamps : true,
        collection : 'Partita'
    }
})
@pre<Partita>("save",function(){
    console.log(this.giocatori.length==1)
    if(this.giocatori.length==4){
        this.isChiusa=true
    }
})
export class Partita{
    id_parita: mongoose.Types.ObjectId;

    @prop({type : Boolean, default : false})
    isChiusa: boolean;

    @prop({type : Number , default : 5, max : 5})
    categoria_max : number

    @prop({type : Number , default : 0 , min : 0})
    categoria_min : number

    @prop({required : true , ref : () => Giocatore})
    giocatori : Ref<Giocatore>[];

    @prop({required : true , ref : () => Circolo})
    circolo : Ref<Circolo>;
   
    constructor(giocatore : Ref<Giocatore> , categoria_max : number , categoria_min : number , circolo : Ref<Circolo> ){
        this.giocatori.push(giocatore);
        this.categoria_max = categoria_max;
        this.categoria_min = categoria_min;
        this.circolo = circolo;
    }

    //rivedere per salvataggio db


    public async aggiungi_player(this : DocumentType<Partita>,gioc : Ref<Giocatore>){
        
        if(!this.isChiusa){
            this.giocatori.push(gioc);

            console.log("new Giocatore Aggiunto")
            if(this.giocatori.length==4){
                this.isChiusa = true;
            }
        }


        await this.save()

    }
    

    public async rimuovi_player(this: DocumentType<Partita>,gioc : Ref<Giocatore>){
        if(this.giocatori.includes(gioc)){
            const index = this.giocatori.indexOf(gioc);
            this.giocatori.splice(index,1)
            this.isChiusa=false;
            await this.deleteOne()

        }
     
    }
}


export const PartitaModel = getModelForClass(Partita)

