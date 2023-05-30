import { Router, Request, Response } from 'express';
import { Utente, UtenteModel, TipoAccount } from '../../classes/Utente';
import jwt from "jsonwebtoken"
import { TokenAutenticazione } from '../../middleware/tokenChecker';

import { logger } from '../../utils/logging';
import { Giocatore, GiocatoreModel, Genere } from '../../classes/Giocatore';
import { CircoloModel } from '../../classes/Circolo';
import { sendHTTPResponse } from '../../utils/general.utils';
import { isValidObjectId } from 'mongoose';
import { CodiceConfermaModel } from '../../classes/CodiceConferma';

const router: Router = Router();

async function cercaUtente(email: string): Promise<null | { utente: Utente, tipo_utente: TipoAccount }> {

    const searched = await UtenteModel.findOne({
        email,
        confermato: true
    }).exec();

    if (searched) {
        return {
            utente: searched,
            tipo_utente: searched.utenteType as TipoAccount
        }
    }

    return null;
}

router.post('', async function (req: Request, res: Response) {
    const { email, password } = req.body;

    var searched = await cercaUtente(email);

    let token;

    if ( !searched ){
        sendHTTPResponse(res, 401, false, "Utente non trovato o password errata")
        return
    } else {
        // Controllo correttezza della password
        let { utente, tipo_utente } = searched;
        console.log(searched.tipo_utente)
        const esito_autenticazione = await utente.checkPassword(password);

        if (!esito_autenticazione) {
            logger.debug(`Autenticazione con password errata utente: ${utente.email}`)

            // Cattiva pratica far capire all'utente nello specifico quale
            // problema non ha permesso di concludere l'autenticazione
            sendHTTPResponse(res, 401, false, "Utente non trovato o password errata")
            return
        }

        // Autenticazione eseguita con successo

        token = jwt.sign(
            {
                tipoAccount: tipo_utente,
                email: utente.email,
                nome: utente.nome
            } as TokenAutenticazione,
            process.env.SUPER_SECRET!,
            {
                expiresIn: process.env.DEFAULT_EXPIRATION_PERIOD || "2d"
            }
        )

        // Invio i dati già destrutturati così che il frontend non debba
        // eseguire nulla
        sendHTTPResponse(res, 200, true, {
            message: 'Autenticazione completata con successo',
            token: token,
            dati: {
                tipoAccount: tipo_utente,
                email: utente.email,
                nome: utente.nome
            } as TokenAutenticazione,
        });
    }
});


router.put("/verificaUtente/:codice", async ( req: Request, res: Response ) => {

    const codice = req.params.codice;

    logger.debug(`Richiesta conferma indirizzo email con codice: ${codice} `)

    if ( !codice || !isValidObjectId(codice) ){
        sendHTTPResponse(res, 401, false, "Il codice inserito non è valido")
        return
    }

    const codice_conferma = await CodiceConfermaModel.findOne({ _id: codice }).populate("utente").exec();

    if( !codice_conferma ){
        // Codice di conferma poco chiaro per motivi di sicurezza
        sendHTTPResponse(res, 401, false, "Il codice inserito non è valido")
        return
    }

    if( !codice_conferma.utente ){
        // Codice di conferma poco chiaro per motivi di sicurezza
        sendHTTPResponse(res, 401, false, "Il codice inserito non è valido")
        logger.error("Attenzione, validato codice di conferma email, ma l'utente non era valido")
        return
    }

    const utente = await UtenteModel.findOne({ _id: codice_conferma.utente._id }).exec();

    if( !utente ){
        // Codice di conferma poco chiaro per motivi di sicurezza
        sendHTTPResponse(res, 401, false, "Il codice inserito non è valido")
        logger.error("Attenzione, validato codice di conferma email, ma l'utente non esiste")
        return
    }

    // Confermo effettivamente l'utente
    utente.confermato = true;
    utente.save();

    await CodiceConfermaModel.deleteOne({ _id: codice_conferma._id }).exec()

    sendHTTPResponse(res, 200, true, "Utente confermato con successo")

})
export default router;
