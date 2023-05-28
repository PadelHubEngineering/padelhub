import { Ref } from "@typegoose/typegoose"
import { Circolo, CircoloModel } from "../../classes/Circolo"
import { TipoAccount } from "../../classes/Utente"
import { sendHTTPResponse } from "../../utils/general.utils"
import { logger } from "../../utils/logging"
import { controlloStringa, controlloEmail, controlloTelefono, controlloPassword, controlloNomeCognome } from "../../utils/parameters.utils"
import { Request, Response } from "express"
import { MongoServerError } from "mongodb";
import { inviaEmailConferma } from "../../utils/email.utils"

export async function registrazioneCircolo(req: Request, res: Response){

       //Prendo i dati che mi interessano dalla richiesta 
       const { nome, email, telefono, password } = req.body 

       logger.info(`Tentativo registrazione circolo: ${nome}, ${email}`)

       //Controllo i dati 
       if(!controlloNomeCognome(res, nome, false, "Iscrizione fallita", "nome circolo")) return 
       if(!controlloEmail(res, email, "Iscrizione fallita", "email")) return
       if(!controlloTelefono(res, telefono, "Iscrizione fallita", "numero di telefono")) return
       if(!controlloPassword(res, password, "Iscrizione fallita", "password")) return

       //Posso inviare i dati al db 
       var circolo_db: Ref<Circolo>;

       try{
        
        circolo_db = await CircoloModel.create({
            nome,
            email,
            telefono,
            password,
            validato: false,
            confermato: false          
        })
            
       }catch(error:any){

        logger.info(error.message);

        if ( error instanceof MongoServerError ){
            const err = error as MongoServerError;

            logger.info(`Errore salvataggio utente: ${email} sul database: ${err.message}`)

            switch( err.code ) {
                case 11000:
                    const key = Object.keys(err.keyValue)
                    if( key.length > 0 )
                        sendHTTPResponse(res, 500, false, `Esiste gia\` un utente con ${key} uguale a "${err.keyValue[key[0]]}"`)
                    else
                        sendHTTPResponse(res, 500, false, `Utente duplicato`)
                    return;
                default:
            }
        }

        sendHTTPResponse(res, 500, false, "Errore interno, impossibile creare l'utente selezionato")
        return;

       }

       logger.info(`Creato nuovo circolo: ${nome}, ${email}`)

       //Posso inviare email di conferma all'utente
       // const invio = inviaEmailConferma("abcabc", circolo_db._id)
       sendHTTPResponse(res, 201, true, "Email di conferma inviata")
       
}


export async function inserisciDatiCircolo(req: Request, res: Response){

        //Prendo i dati che mi interessano dalla richiesta 
        const { 
            nome, 
            email, 
            telefono, 
            password } = req.body 


}