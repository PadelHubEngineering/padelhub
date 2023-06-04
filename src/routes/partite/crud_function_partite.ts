import { NextFunction, Request, Response } from "express"
import { Partita, PartitaModel } from "../../classes/Partita"
import 'mongoose'
import { isValidObjectId } from "mongoose"
import { sendHTTPResponse } from "../../utils/general.utils"
import { logger } from "../../utils/logging"
import { Circolo, CircoloModel } from "../../classes/Circolo"
import { TipoAccount } from "../../classes/Utente"
import { Giocatore, GiocatoreModel } from "../../classes/Giocatore"
import { PrenotazioneGiocatore, PrenotazioneModel } from "../../classes/PrenotazionePartita"



//creazione di una partita
const createPartita = async (req: Request, res: Response, next: NextFunction) => {

    const { giocatori, circolo, categoria_min, categoria_max, orario } = req.body



   
    if (!isValidObjectId(circolo)) {
        sendHTTPResponse(res, 400, false, "Id circolo formalmente errato")
        return
    }

    if (categoria_max < categoria_min || (categoria_min < 1 || categoria_min > 5) || (categoria_max < 1 || categoria_max > 5)) {
        sendHTTPResponse(res, 400, false, "Categoria invalida")
        return
    }


    for (let id_giocatore of giocatori) {
        if (!isValidObjectId(id_giocatore)) {
            sendHTTPResponse(res, 400, false, "Trovati giocatori non validi tra quelli forniti")
            return
        }
        const gioc_db = await GiocatoreModel.exists({ _id: id_giocatore }).exec();
        if (gioc_db === null) {
            sendHTTPResponse(res, 400, false, "Trovati giocatori non esistenti tra quelli forniti")
            return
        }
    }

    const partita = new PartitaModel({
        giocatori: giocatori,
        circolo: circolo,
        categoria_min: categoria_min,
        categoria_max: categoria_max,
        orario: orario

    })

    /*
    //preparing the reservation
    const prenotazione = JSON.stringify({
        giocatore : giocatori,
        circolo : circolo,
        orario : orario,

    })
    const token = req.headers["x-access-token"]?.toString()
    if(!token){
        sendHTTPResponse(res, 500, false, "[server] Internal error")
        return

    }
    
    await fetch("http://localhost:9090/api/v1/prenotazioneGiocatori",{
        method : "POST",
        headers : {
            "x-access-token" : token,
            "content-type" : "application/json"

        },
        body : prenotazione
 
    } ).then(res => {console.log(res.json() )
    }).then(data => {console.log(data)})


    */

   let flag= 0;
    return await PartitaModel.create(partita)
        .then(async function(partita){
            console.log(partita)
            flag=1
            let costo = await partita.getPrezzo(giocatori)
            const prenotazione = new PrenotazioneModel({
                partita : partita.id,
                giocatore: giocatori.at(0) as String,
                dataPrenotazione : orario ,
                costo : costo
            })
            const p= await PrenotazioneModel.create(prenotazione)
            
            //.catch( async function(err){await PartitaModel.deleteOne(partita.id)}
            sendHTTPResponse(res, 200, true, partita) })
        .catch(async function(error){if(flag){await PartitaModel.deleteOne(partita._id) ;console.log("Eliminato con successo")}sendHTTPResponse(res, 500, false, "[server] Errore interno") });
    /*
       
    const parza = await(PartitaModel).create(partita)
    try{

    }catch
    */
    

}

//lettura di una singola partita
const readPartita = async (req: Request, res: Response, next: NextFunction) => {

    const id = req.params.PartitaId
    if (!isValidObjectId(id)) {
        sendHTTPResponse(res, 401, false, "ID partita invalido")
        return
    }

    PartitaModel.findById(id).populate("giocatori")
        .then(partita => partita ? sendHTTPResponse(res, 200, true, partita) : sendHTTPResponse(res, 404, false, "Partita inesistente"))
        .catch((error) => { sendHTTPResponse(res, 500, false, "[server] Errore interno") })
}

//lettura di tutte le partite
const readAllPartite = async (req: Request, res: Response, next: NextFunction) => {
    const tipoAccount = req.utenteAttuale?.tipoAccount;
    const email = req.utenteAttuale?.email

    if (tipoAccount == TipoAccount.Giocatore) {
        console.log("giocatore")
        return await PartitaModel.find().populate("giocatori")
            .then(partite => sendHTTPResponse(res, 200, true, partite))
            .catch((error) => sendHTTPResponse(res, 500, false, "[server] Errore interno"))

    } else if (tipoAccount == TipoAccount.Circolo) {
        const c_id = await CircoloModel.findOne({ email: email })
        if (c_id == null) {
            sendHTTPResponse(res, 500, false, "[server] Errore interno")
            return
        }

        return await PartitaModel.find({ circolo: c_id?.id }).populate("giocatori")
            .then(partite => sendHTTPResponse(res, 200, true, partite))
            .catch((error) => sendHTTPResponse(res, 500, false, "[server] Errore interno"))
    }
}


//eliminazione della partita
const deletePartita = async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.PartitaId;
    if (!isValidObjectId(id)) {
        sendHTTPResponse(res, 401, false, "ID partita invalido")
        return
    }

    return await PartitaModel.findByIdAndDelete(id)
        .then((partita) => partita ? sendHTTPResponse(res, 201, true, partita) : sendHTTPResponse(res, 404, false, "Nessuna partita trovata"))
        .catch((error) => sendHTTPResponse(res, 500, false, "[server] Errore interno"))

  
}


//aggiunta di un altro giocatore alla partita
const updatePartita = async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.PartitaId;
    //console.log(id)
    const giocatore = req.body.giocatore
    //console.log(giocatore)
    if (!isValidObjectId(id)) {
        return sendHTTPResponse(res, 401, false, "ID partita invalido")
    }

    //check level
    return await PartitaModel.findById(id)
        .then(async (partita) => {
            if (partita) {
                if (partita?.checkChiusa()) {
                    console.log("Piena")
                    sendHTTPResponse(res, 401, false, "Partita già al completo")
                    return
                } else {
                    if (await partita.checkLevel(giocatore) == false) {
                        sendHTTPResponse(res, 401, false, "Non puoi partecipare a questa partita : Livello invalido")
                        return
                    }
                    console.log(`C'è posto ${await partita.checkLevel(giocatore)}`)
                    const p = await PartitaModel.findById(id).then((p) => p?.aggiungi_player(giocatore))

                    sendHTTPResponse(res, 201, true, p as Partita)
                    return
                }
            } else {
                sendHTTPResponse(res, 404, false, "ID partita invalido")
                return

            }
        })
        .catch((error) => { sendHTTPResponse(res, 500, false, "[server] Errore interno"); console.log(error) })


}

export { createPartita, readPartita, readAllPartite, deletePartita, updatePartita }
