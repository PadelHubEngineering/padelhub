import { Router, Request, Response } from "express";
import { PrenotazioneCampo, PrenotazioneCampoModel } from "../../classes/PrenotazioneCampo";
import { Circolo, CircoloModel, Campo, TipoCampo } from "../../classes/Circolo";
import { TipoAccount } from "../../classes/Utente";
import { checkTokenCircolo } from "../../middleware/tokenChecker";
import { logger } from "../../utils/logging";
import { Error } from "mongoose";
import { convertToObject, isNumericLiteral } from "typescript";
import { error } from "winston";
import { Partita } from "../../classes/Partita";
import { HTTPResponse, sendHTTPResponse } from "../../utils/general.utils";

import { DateTime } from  "luxon"

const router: Router = Router();


router.post('/prenotazioneSlot', async (req: Request, res: Response) => {
    const { idCampo } = req.body;

    const _dataOraPrenotazione = req.body.dataOraPrenotazione

    logger.debug(`Tentativo di prenotazione slot: ${_dataOraPrenotazione}, campo: ${ idCampo }`)

    // @ts-expect-error
    if( !_dataOraPrenotazione || typeof(_dataOraPrenotazione) !== "string" || Date.parse(_dataOraPrenotazione) === NaN){
        sendHTTPResponse(res, 400, false, "La data inserita non è corretta")
        return
    }

    const dataOraPrenotazione = new Date(_dataOraPrenotazione);

    // Scarico i dati del mio circolo
    const mioCircolo = await CircoloModel.findOne({ email: req.utenteAttuale?.email }).exec()

    if (!mioCircolo) {
        sendHTTPResponse(res, 401, false, "Impossibile scaricare i dati del circolo")
        return
    }

    // Constrollo che il campo selezionato esista
    const campiTrovati = mioCircolo.campi.filter(e => e.id === parseInt(idCampo))
    if ( campiTrovati.length === 0 ) {
        sendHTTPResponse(res, 500, false, "Campo non trovato")
        return
    }

    // Controllo che non ci siano altre prenotazioni per la stessa fascia oraria
    // per lo stesso circolo
    const searched = await PrenotazioneCampoModel.findOne({
        dataSlot: dataOraPrenotazione,
        circolo: mioCircolo._id,
        idCampo: idCampo,
    }).exec()

    if (searched) {
        sendHTTPResponse(res, 500, false, "Prenotazione già inserita dal circolo per lo slot")
        return
    }

    let dataOraFinale: DateTime = DateTime.fromJSDate(dataOraPrenotazione);
    dataOraFinale = dataOraFinale.plus({ minutes: mioCircolo.durataSlot })

    // Nessun problema, procedo alla creazione della prenotazione
    let prenotazione = new PrenotazioneCampoModel();
    await prenotazione.prenotazioneCircolo(
        dataOraPrenotazione,
        dataOraFinale.toJSDate(),
        idCampo,
        mioCircolo,
    )

    sendHTTPResponse(res, 200, true, {
        message: "Prenotazione creata con successo",
        prenotazione: prenotazione
    })
});

router.delete('/prenotazioneSlot/:id_prenotazione', async (req: Request, res: Response) => {

    const id_prenotazione = req.params.id_prenotazione

    // Controllo che la prenotazione esista nel db

    const prenotazione = await PrenotazioneCampoModel.findOne({ _id: id_prenotazione }).exec();

    if( !prenotazione ){
        sendHTTPResponse(res, 401, false, "Impossibile trovare la prenotazione richiesta");
        return
    }

    const deleted = await PrenotazioneCampoModel.deleteOne({
        _id: id_prenotazione
    }).exec();

    if ( deleted.deletedCount == 0 ) {
        sendHTTPResponse(res, 401, false, "Impossibile eliminare la prenotazione");
        return
    }

    sendHTTPResponse(res, 200, true, "Prenotazione eliminata con successo")

})

router.get('/prenotazioniSlot', async (req: Request, res: Response) => {
    const mioCircolo = await CircoloModel.findOne({ email: req.utenteAttuale?.email })
    var dateReq = req.headers["data-attuale"] as string

    if (!dateReq) {
        sendHTTPResponse(res, 401, false, "Data non passata in headers (data-attuale) alla richiesta")
        return
    }
    if (!mioCircolo) {
        sendHTTPResponse(res, 401, false, "Impossibile ritrovare il circolo. Token non valido");
        return
    }

    var giorno: Date = new Date();

    try {
        giorno = new Date(dateReq)

    }
    catch (err) {
        logger.error(err)
    }
    
    var dataInizioGiorno = new Date(giorno.getFullYear(), giorno.getMonth(), giorno.getDate() + 1)
    dataInizioGiorno.setUTCHours(0)
    var dataFineGiorno = new Date(giorno.getFullYear(), giorno.getMonth(), giorno.getDate() + 2)
    dataFineGiorno.setUTCHours(0)

    const prenotazioniSlot: PrenotazioneCampo[] = await PrenotazioneCampoModel.find({
        circolo: mioCircolo._id,
        inizioSlot: {
            $gte: dataInizioGiorno,
            $lt: dataFineGiorno
        }
    }).exec()

    interface IPrenotazione {
        id: any
        inizioSlot: Date
        fineSlot: Date
        tipoUtente: TipoAccount
    }
    interface IOccupazioneCampi{
        idCampo: number, 
        prenotazioni: IPrenotazione[]
    }
    interface IPrenotazioniSlot {
        orarioApertura: Date;
        orarioChiusura: Date;
        durataSlot: number;
        campiInterni: IOccupazioneCampi[];        
        campiEsterni: IOccupazioneCampi[];
    }

    var retObj: IPrenotazioniSlot = {
        orarioApertura: mioCircolo.orarioSettimanale[giorno.getDay()].orarioApertura,
        orarioChiusura: mioCircolo.orarioSettimanale[giorno.getDay()].orarioChiusura,
        durataSlot: mioCircolo.durataSlot,
        campiInterni: [], 
        campiEsterni: []
    }

    mioCircolo.campi.forEach((campo) => {
        if(campo.tipologia == TipoCampo.Esterno){
            retObj.campiEsterni.push({ idCampo: campo.id, prenotazioni: [] })
        }
        else if(campo.tipologia == TipoCampo.Interno){
            retObj.campiInterni.push({ idCampo: campo.id, prenotazioni: [] })
        }
    });

    prenotazioniSlot.forEach((prenotazioneCampo) => {
        var campoPrenotato: Campo | undefined = mioCircolo.campi.find((campo) => campo.id == prenotazioneCampo.idCampo)
        if (!campoPrenotato) {
            logger.error("Campo non esistente");
            return;
        }

        var prenotazione = {
            id: prenotazioneCampo._id,
            inizioSlot: prenotazioneCampo.inizioSlot,
            fineSlot: prenotazioneCampo.fineSlot,
            tipoUtente: prenotazioneCampo.partita == undefined ? TipoAccount.Circolo : TipoAccount.Giocatore
        }
        if (campoPrenotato.tipologia == TipoCampo.Esterno) {
            console.log("campo esterno")
            var ind = retObj.campiEsterni.findIndex((campo) => campo.idCampo == prenotazioneCampo.idCampo)
            retObj.campiEsterni[ind].prenotazioni.push(prenotazione)
        }
        else if (campoPrenotato.tipologia == TipoCampo.Interno) {
            console.log("campo interno")
            var ind = retObj.campiInterni.findIndex((campo) => campo.idCampo == prenotazioneCampo.idCampo)
            retObj.campiInterni[ind].prenotazioni.push(prenotazione)
        }
        else {
            logger.error("Tipo campo non definito");
            return
        }
    })


    sendHTTPResponse(res, 200, true, retObj)
    return
})


export default router;
