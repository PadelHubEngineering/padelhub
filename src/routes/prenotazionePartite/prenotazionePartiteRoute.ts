import "mongoose";
import "@typegoose/typegoose"
import { CircoloModel,Circolo } from "../../classes/Circolo";
import { GiocatoreModel,Giocatore} from "../../classes/Giocatore";
import { Utente , UtenteModel, TipoAccount } from "../../classes/Utente";
import { PrenotazioneGiocatore , PrenotazioneModel } from "../../classes/PrenotazionePartita";
import {Router ,Request ,Response} from "express"
import { checkTokenCircolo , checkTokenGiocatoreOCircolo, checkTokenGiocatore} from '../../middleware/tokenChecker'
import { isValidObjectId } from "mongoose";
import { sendHTTPResponse } from "../../utils/general.utils";
import { http } from "winston";
import { PartitaModel } from "../../classes/Partita";
import { pre } from "@typegoose/typegoose";


const router = Router();

//getting every reservations of an user //filter
router.get("/",checkTokenGiocatoreOCircolo ,async (req : Request, res :Response) =>{
    const tipoAccount = req.utenteAttuale?.tipoAccount;
    const email = req.utenteAttuale?.email

    if (tipoAccount == TipoAccount.Giocatore) {
        console.log("giocatore")
        return await PrenotazioneModel.find().populate("giocatori")
            .then(prenotazioni => sendHTTPResponse(res, 200, true, prenotazioni))
            .catch((error) => sendHTTPResponse(res, 500, false, "[server] Errore interno"))

    } else if (tipoAccount == TipoAccount.Circolo) {
        const c_id = await CircoloModel.findOne({ email: email })
        if (c_id == null) {
            sendHTTPResponse(res, 500, false, "[server] Errore interno")
            return
        }

        return await PrenotazioneModel.find({ circolo: c_id?.id }).populate("giocatori")
            .then(prenotazioni => sendHTTPResponse(res, 200, true, prenotazioni))
            .catch((error) => sendHTTPResponse(res, 500, false, "[server] Errore interno"))
    }
    

    
})


//getting a single user reservation
router.get("/:id", async (req : Request, res :Response)=>{
    let id = req.params.id

    if (!isValidObjectId(id)) {
        sendHTTPResponse(res, 401, false, "ID prenotazione invalido")
        return
    }

    PrenotazioneModel.findById(id)
    .then((prenotazioni) => {
        prenotazioni ? sendHTTPResponse(res,200,true,prenotazioni) : sendHTTPResponse(res,401,false,"ID prenotazione invalido") })
    .catch(() => sendHTTPResponse(res,500,false,"[server] Errore Interno"))

})


//deleting a single reservation/cashback
router.delete("/:id",async (req : Request, res :Response)=>{
    const id = req.params.id;
    if (!isValidObjectId(id)) {
        sendHTTPResponse(res, 401, false, "ID prenotazione invalido")
        return
    }
    let prenotazione = await PrenotazioneModel.findById(id)
    if(!prenotazione){
        return sendHTTPResponse(res, 404, false, "Prenotazione inesistente")
    }
    let partita = await PartitaModel.findById(prenotazione.partita._id)
    if(!partita){
        return sendHTTPResponse(res, 500, false, "[server] Errore interno")
    }
    console.log(partita)
    let gioc = prenotazione.giocatore._id
    if(!gioc){
        return sendHTTPResponse(res, 500, false, "[server] Errore interno")
    }
    if(await partita.rimuovi_player(gioc)==true){
        try{
            let risposta=await prenotazione.deleteOne()
            sendHTTPResponse(res, 201, true,risposta)
        }catch(err){
            return sendHTTPResponse(res, 500, false, "[server] Errore interno")
        }
        
    }else{
        return sendHTTPResponse(res, 500, false, "[server] Errore interno")
    }
    

});


export default router;

