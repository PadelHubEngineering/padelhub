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
    this.checkChiusa()
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

    @prop({ required: false })
    public orario: Date = new Date(0, 0)
   
    constructor(giocatore : Ref<Giocatore> , categoria_max : number , categoria_min : number , circolo : Ref<Circolo> ){
        this.giocatori.push(giocatore);
        this.categoria_max = categoria_max;
        this.categoria_min = categoria_min;
        this.circolo = circolo;
    }

    //rivedere per salvataggio db


    public async aggiungi_player(this : DocumentType<Partita>,gioc : Ref<Giocatore>){

        if(!this.checkChiusa()){
            this.giocatori.push(gioc);
            console.log("new Giocatore Aggiunto da metodo")
            return await this.save()
        }else{
            return this
        }
        
    }

    public checkChiusa(){
        if(this.giocatori.length==4){
            this.isChiusa =true
        }else{
            this.isChiusa=false
        }
        return this.isChiusa
    }


    public async checkLevel(this : DocumentType<Partita>,gioc : Ref<Giocatore>){
        const g_level = await GiocatoreModel.findById(gioc,"livello").catch((err)=> console.log(err))
        if(!g_level?.livello){return false}
        if(g_level?.utenteType == "Giocatore"){
            var test = 3
            if(g_level.livello <= this.categoria_max && g_level?.livello >= this.categoria_min){
                return true
            }
        }
        return false
        
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

