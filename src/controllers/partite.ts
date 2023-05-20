import { NextFunction , Request ,Response} from "express"
import { PartitaModel, Partita } from "../classes/Partita"
import 'mongoose'
import { isValidObjectId } from "mongoose"
import { sendHTTPResponse, HTTPResponse } from "../utils/general.utils"
import { logger } from "../utils/logging"

//creazione di una partita
const createPartita = async (req: Request, res: Response, next : NextFunction) =>{
    const {giocatori, circolo , categoria_min , categoria_max, orario} = req.body
    
    const partita = new PartitaModel({
        giocatori : giocatori,
        circolo : circolo,
        categoria_min : categoria_min,
        categoria_max : categoria_max,
        orario : orario

    })

    /*if( !_dataOraPrenotazione || typeof(_dataOraPrenotazione) !== "string" || Date.parse(_dataOraPrenotazione) === NaN){
    sendHTTPResponse(res, 400, false, "La data inserita non è corretta")
        return
    }*/

    return await partita.save()
    .then((partita) => {sendHTTPResponse(res, 200, true, partita)})
    .catch((error)=> {sendHTTPResponse(res, 500 , false, "[server] Errore interno")});
}

//lettura di una singola partita
const readPartita = async (req : Request, res : Response, next : NextFunction) =>{

    const id = req.params.PartitaId
    if(!isValidObjectId(id)){
        return sendHTTPResponse(res, 401 , false,"ID partita invalido")
    }

    return await PartitaModel.findById(id).populate("giocatori")
    .then(partita => partita ? sendHTTPResponse(res, 200, true, partita) : sendHTTPResponse(res, 404 , true, "Partita non inesistente"))
    .catch((error) => {sendHTTPResponse(res, 500 , false, "[server] Errore interno")})


}

//lettura di tutte le partite
const readAllPartite = async (req : Request, res : Response, next : NextFunction)=>{
    return await PartitaModel.find().populate("giocatori")
    .then(partite =>  sendHTTPResponse(res, 200, true, partite))
    .catch((error) => sendHTTPResponse(res, 500 , false, "[server] Errore interno")) 
}


//eliminazione della partita
const deletePartita = async (req :Request, res : Response, next : NextFunction) => {
    const id = req.params.PartitaId;
    console.log(id)
    if(!isValidObjectId(id)){
        return sendHTTPResponse(res, 401 , false,"ID partita invalido")
    }

    return await PartitaModel.findByIdAndDelete(id)
    .then((partita) => partita ? sendHTTPResponse(res, 201, true, partita) : sendHTTPResponse(res, 404 , true, "Nessuna partita trovata") )
    .catch((error) => sendHTTPResponse(res, 500 , false,"[server] Errore interno")) 
    
    //.then((partita) => partita ? res.status(201).json({partita}) : res.json(404).json({message: "Partita non trovata"}))
    //.catch((error) => res.status(500).json({error}))

}


//aggiunta di un altro giocatore alla partita
const updatePartita = async (req : Request , res : Response, next : NextFunction) => {
    const id = req.params.PartitaId;
    console.log(id)
    const giocatore = req.body.giocatore
    console.log(giocatore)
    if(!isValidObjectId(id)){
       
        return sendHTTPResponse(res, 401 , false,"ID partita invalido")
    }

    //check level
    return await PartitaModel.findById(id)
    .then(async (partita) => {
        if(partita){

            if(partita?.checkChiusa() ){
                console.log("Piena")
                sendHTTPResponse(res, 401, false, "Partita già al completo")
            }else{
                if(await partita.checkLevel(giocatore)==false){
                    sendHTTPResponse(res, 401, false, "Non puoi partecipare a questa partita : Livello invalido")
                    return
                    
                }
                console.log("C'è posto")
                const p =await PartitaModel.findById(id).then((p) => p?.aggiungi_player(giocatore))
                /*
                p?.giocatori.push(giocatore)
                if(p?.giocatori.length==4){
                    p.isChiusa = true
                }
                await p?.save()*/
                //create prenotazione res.post. prenotazione
                sendHTTPResponse(res, 201, true, p as Partita)  
            }
        }else{
            sendHTTPResponse(res, 404 , false,"ID partita invalido")
            

    } })
    .catch((error) => { sendHTTPResponse(res, 500 , false, "[server] Errore interno"); console.log(error)}) 
    

}

export {createPartita,readPartita, readAllPartite, deletePartita,updatePartita}