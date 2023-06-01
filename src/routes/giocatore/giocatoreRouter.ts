import { Router, Request, Response } from "express";
import { Genere, Giocatore, GiocatoreModel } from "../../classes/Giocatore";
import { sendHTTPResponse } from "../../utils/general.utils";
import { controlloData, controlloEmail, controlloInt, controlloNickname, controlloNomeCognome, controlloPassword, controlloRegExp, controlloStrEnum, controlloTelefono } from "../../utils/parameters.utils";
import { logger } from "../../utils/logging";
import base64 from "@hexagon/base64";
import { MongoServerError } from "mongodb";
import { inviaEmailConferma } from "../../utils/email.utils";
import { Ref } from "@typegoose/typegoose";
import { Utente } from "../../classes/Utente";
import { CodiceConferma, CodiceConfermaModel } from "../../classes/CodiceConferma";


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

    if ( !controlloNomeCognome(res, nome, false, "nome") ) return;

    if ( !controlloNomeCognome(res, cognome, false, "cognome") ) return;

    if ( !controlloEmail(res, email, "Email") ) return;

    if ( !controlloTelefono(res, telefono, "Telefono") ) return;

    if ( !controlloNickname(res, nickname, false) ) return;

    if ( !controlloData(res, dataDiNascita, "Data di nascita") ) return;

    if ( !controlloStrEnum(res, genere, Genere, "Genere") ) return;

    if( !controlloInt(res, livello, 0, 5000, false, "Livello") ) return;

    if ( !controlloRegExp(res, tagTelegram, false, /.*\B@(?=\w{5,32}\b)[a-zA-Z0-9]+(?:_[a-zA-Z0-9]+)*.*/, "Tag Telegram")) return;

    if( !controlloPassword(res, password, "password") ) return;

    // Controllo immagine base64
    // Non controllo il campo: era una stringa e rimarra` una stringa

    if ( !base64.validate(foto) ) {
        sendHTTPResponse(res, 400, false, "La foto caricata non e` base64 valido")
        return
    }


    // Pratica comune: se la email non ti è arrivata, allora reiscriviti con gli stessi dati
    const deleted = await GiocatoreModel.deleteMany({ $or: [{ nickname }, { email }], confermato: false }).exec();

    if ( deleted.deletedCount > 0 )
        logger.info(`Eliminati ${deleted.deletedCount} giocatori con le stesse info di login non confermati. Iscrizione in corso di ${nickname}, ${email}`)

    let giocatore_db!: Ref<Giocatore>;

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

    let codice_conferma_utente = new CodiceConferma(giocatore_db)

    codice_conferma_utente = await CodiceConfermaModel.create(codice_conferma_utente)

    const invio = await inviaEmailConferma(codice_conferma_utente._id.toString(), giocatore_db._id )

    if ( invio )
        sendHTTPResponse(res, 201, true, "Email di conferma inviata")
    else
        sendHTTPResponse(res, 500, false, "Impossibile inviare email di conferma, prego riprovare")
} )



export default router;
