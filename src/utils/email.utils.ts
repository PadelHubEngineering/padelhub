import mongoose, { ObjectId } from "mongoose";
import { logger } from "./logging";

import Mailjet from "node-mailjet";
import { UtenteModel } from "../classes/Utente";
import { CircoloModel } from "../classes/Circolo";

export async function inviaEmailConferma( codice_conferma: string, id_utente: string | mongoose.Types.ObjectId ) {

    // controllo che id_giocatore sia valido ed esista nel db

    const utente = await UtenteModel.findOne({ _id: id_utente }).exec();

    if( !utente ){
        logger.warning(`Tentativo di inviare email a giocatore con id: ${id_utente} non valido`)
        return false;
    }

    const emailClient = Mailjet.apiConnect(process.env.MJ_APIKEY_PUBLIC!, process.env.MJ_APIKEY_PRIVATE!)
    try{
        const request = await emailClient
            .post("send", {'version': 'v3.1'})
            .request({
                "Messages":[
                    {
                        "From": {
                                "Email": "marco.zanon@pm.me",
                                "Name": "Padelhub"
                        },
                        "To": [
                                {
                                        "Email": utente.email,
                                        "Name": `${utente.nome}`
                                }
                        ],
                        "Subject": "Conferma indirizzo email",
                        "HTMLPart":
                        `
                            Clicca sul link sottostante per confermare il tuo indirizzo email:
                            <a href='${process.env.FRONTEND_URL}${process.env.CONFIRMATION_EMAIL_URL}/?codiceConferma=${codice_conferma}' >Clicca qui</a>
                        `
                    }
                ]
            })
    } catch( e ) {
        logger.error("Impossibile inviare email di conferma" + (e as any).message)
        return false
    }

    logger.info(`Inviata con successo email di conferma all'utente ${utente.email}`)
    return true;

}

export async function inviaEmailOnboarding( onboardingLink: URL, id_utente: string ) {

    // controllo che id_giocatore sia valido ed esista nel db

    const utente = await CircoloModel.findOne({ _id: id_utente }).exec();

    if( !utente ){
        logger.warning(`Tentativo di inviare email a giocatore con id: ${id_utente} non valido`)
        return false;
    }

    const emailClient = Mailjet.apiConnect(process.env.MJ_APIKEY_PUBLIC!, process.env.MJ_APIKEY_PRIVATE!)

    try{
        const request = await emailClient
            .post("send", {'version': 'v3.1'})
            .request({
                "Messages":[
                    {
                        "From": {
                                "Email": "marco.zanon@pm.me",
                                "Name": "Padelhub"
                        },
                        "To": [
                                {
                                        "Email": utente.email,
                                        "Name": `${utente.nome}`
                                }
                        ],
                        "Subject": "Onboarding dati di fatturazione",
                        "HTMLPart":
                        `
                            Clicca sul link sottostante per fare inserire i tuoi dati di fatturazione:
                            <a href='${onboardingLink.toString()}' >Clicca qui!</a>
                        `
                    }
                ]
            })
    } catch( e ) {
        logger.error("Impossibile inviare email di conferma" + (e as any).message)
        return false
    }

    logger.info(`Inviata con successo email di onboarding all'utente ${utente.email}`)
    return true;

}
