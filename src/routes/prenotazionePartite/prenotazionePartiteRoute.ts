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

//add a new reservation
router.post("/", async (req : Request, res :Response)=>{
    setTimeout(() => {
        
    }, 300);

    console.log("SONO IN PRENOTAZIONEEE")
    const {giocatore, orario, circolo} = await req.body 
    console.log(giocatore, orario , circolo)
    
    return sendHTTPResponse(res, 200, true, {"message":"OK GIUSTOOO"})


}); 



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

})



export default router;

