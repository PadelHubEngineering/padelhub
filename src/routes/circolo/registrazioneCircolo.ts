import { Circolo, CircoloModel } from "../../classes/Circolo"
import { TipoAccount } from "../../classes/Utente"
import { sendHTTPResponse } from "../../utils/general.utils"
import { logger } from "../../utils/logging"
import { controlloStringa, controlloEmail, controlloTelefono, controlloPassword, controlloNomeCognome } from "../../utils/parameters.utils"
import { Request, Response } from "express"

export async function registrazioneCircolo(req: Request, res: Response){

       //Prendo i dati che mi interessano dalla richiesta 
       const { nome, email, telefono, password } = req.body 

       //Controllo i dati 
       if(!controlloNomeCognome(res, nome, false, "Iscrizione fallita", "nome circolo")) return 
       if(!controlloEmail(res, email, "Iscrizione fallita", "email")) return
       if(!controlloTelefono(res, telefono, "Iscrizione fallita", "numero di telefono")) return
       if(!controlloPassword(res, password, "Iscrizione fallita", "password")) return

       //Posso inviare i dati al db 
       let circolo_db
       try{
           circolo_db = await CircoloModel.create({
                nome,
                email,
                telefono,
                password,
                validato: false,
                utenteType: TipoAccount.Circolo
           }) 
       }catch(error){
            logger.error(`findOne error--> ${error}`);

            //Controllo se c'è già quell'email tra gli utenti registrati
            if(error === 11000){
                sendHTTPResponse(res, 401, false, "Registrazione fallita: email già registrata")
                return;
            }
            
            sendHTTPResponse(res, 401, false, "Registrazione fallita: errore di sistema")
            return;
       }

       //Posso inviare email di conferma all'utente
       sendHTTPResponse(res, 200, true, "Circolo registrato con successo")
       return; 
       
}