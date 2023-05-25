import { Router, Request, Response } from "express";
import { Genere, GiocatoreModel } from "../../classes/Giocatore";
import { sendHTTPResponse } from "../../utils/general.utils";
import { controlloData, controlloEmail, controlloInt, controlloNickname, controlloNomeCognome, controlloPassword, controlloRegExp, controlloStrEnum, controlloTelefono } from "../../utils/parameters.utils";
import { logger } from "../../utils/logging";
import base64 from "@hexagon/base64";
import { MongoServerError } from "mongodb";


const router = Router();

router.post("/", async ( req: Request, res: Response ) => {

    const {
        nome,
        cognome,
        email,
        password,
        telefono,
        nickname,
        dataDiNascita,
        genere,
        livello,
        foto,
        tagTelegram,
    } = req.body;

    logger.info(`Tentativo registrazione utente: ${email}, ${nickname}`)

    if ( !controlloNomeCognome(res, nome, false, "Iscrizione fallita", "nome") ) return;

    if ( !controlloNomeCognome(res, cognome, false, "Iscrizione fallita", "cognome") ) return;

    if ( !controlloEmail(res, email, "Iscrizione fallita", "Email") ) return;

    if ( !controlloTelefono(res, telefono, "Iscrizione fallita", "Telefono") ) return;

    if ( !controlloNickname(res, nickname, false, "Iscrizione fallita") ) return;

    if ( !controlloData(res, dataDiNascita, "Iscrizione fallita", "Data di nascita") ) return;

    if ( !controlloStrEnum(res, genere, Genere, "Iscrizione fallita", "Genere") ) return;

    if( !controlloInt(res, livello, 0, 5000, false, "Iscrizione fallita", "Livello") ) return;

    if ( !controlloRegExp(res, tagTelegram, false, /.*\B@(?=\w{5,32}\b)[a-zA-Z0-9]+(?:_[a-zA-Z0-9]+)*.*/, "Iscrizione fallita", "Tag Telegram")) return;

    if( !controlloPassword(res, password, "Iscrizione fallita", "password") ) return;

    // Controllo immagine base64
    // Non controllo il campo: era una stringa e rimarra` una stringa

    if ( !base64.validate(foto) ) {
        sendHTTPResponse(res, 400, false, "La foto caricata non e` base64 valido")
        return
    }

    let giocatore_db;

    try{
        giocatore_db = await GiocatoreModel.create({
            nome,
            email,
            telefono,
            password,

            cognome,
            nickname,
            dataDiNascita,
            genere,
            livello,
            confermato: false,
            foto,
            tagTelegram,
            circoliAssociati: [],
            preferiti: [],
        })
    } catch( e ) {

        if ( e instanceof MongoServerError ){
            const err = e as MongoServerError;

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

    logger.info(`Creato nuovo giocatore: ${email}, ${nickname}`)
    sendHTTPResponse(res, 201, true, "Giocatore creato con successo")

} )

export default router;
