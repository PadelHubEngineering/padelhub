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
    const id = req.params.PartitaId;
    if (!isValidObjectId(id)) {
        sendHTTPResponse(res, 401, false, "ID partita invalido")
        return
    }

    //cerca prenotazione e prendi partita_id
    // ricerca partita (populate dalla prenotazione)
    // rimuovi il giocatore dall'array della partita e poi salva partita aggiornata, se vuota, elimina partita
    // infine elimina la prenotazione

    let prenotazione= await PrenotazioneModel.findByIdAndDelete(id)

    if(prenotazione)
        .then((prenotazione) => prenotazione ? sendHTTPResponse(res, 201, true, prenotazione) : sendHTTPResponse(res, 404, false, "Nessuna prenotazione trovata"))
        .catch((error) => sendHTTPResponse(res, 500, false, "[server] Errore interno") )
    


  
});


export default router;

