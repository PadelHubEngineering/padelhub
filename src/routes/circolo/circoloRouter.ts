import { Router, Request, Response } from "express";
import { PrenotazioneCampo, PrenotazioneCampoModel } from "../../classes/PrenotazioneCampo";
import { Circolo, CircoloModel, Campo, TipoCampo } from "../../classes/Circolo";
import { TipoAccount } from "../../classes/Utente";
import { checkTokenCircolo, checkTokenGiocatore } from "../../middleware/tokenChecker";
import { logger } from "../../utils/logging";
import { Error, isValidObjectId } from "mongoose";
import { convertToObject, isNumericLiteral } from "typescript";
import { error } from "winston";
import { Partita, PartitaModel } from "../../classes/Partita";
import { HTTPResponse, sendHTTPResponse } from "../../utils/general.utils";

import { DateTime } from  "luxon"
import { controlloData } from "../../utils/parameters.utils";
import { PrenotazionePartitaModel } from "../../classes/PrenotazionePartita";
import { Giocatore, GiocatoreModel } from "../../classes/Giocatore";
import { DocumentType, Ref } from "@typegoose/typegoose"

type PartiteAperteI = {

    giaPrenotato: boolean,
    partite: PartitaRetI[]
}

type PartitaRetI = {
    orario: Date,
    giocatori: GiocatoreRetI[],
    categoria_max: number,
    categoria_min: number,
}

type GiocatoreRetI = {
    nome: string,
    cognome: string,
    nickname: string,
    foto: string
}

function g_to_ret(giocatore: DocumentType<Giocatore>) {
    return {
        nome: giocatore.nome,
        cognome: giocatore.cognome,
        nickname: giocatore.nickname,
        foto: giocatore.foto,
    } as GiocatoreRetI
}

async function map_to_display(partite: DocumentType<Partita>[]) {

    let ret: PartitaRetI[] = [];

    for( const partita of partite ) {

        const partita_g = await partita.populate("giocatori")

        // Con il populate, giocatori da Ref<Giocatore>[] diventa DocumentType<Giocatore>[]
        // @ts-ignore-error
        const giocatori_partita: DocumentType<Giocatore>[] = partita_g.giocatori;

        ret.push({
            ...partita_g.toObject(),
            giocatori: giocatori_partita.map( g_to_ret ),
            circolo: undefined,
            createdAt: undefined,
            updatedAt: undefined,
            __v: undefined,
        } as PartitaRetI)
    }

    return ret
}



const router: Router = Router();


router.post('/prenotazioneSlot', checkTokenCircolo, async (req: Request, res: Response) => {
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

    sendHTTPResponse(res, 201, true, {
        message: "Prenotazione creata con successo",
        prenotazione: prenotazione
    })
});

router.delete('/prenotazioneSlot/:id_prenotazione', checkTokenCircolo, async (req: Request, res: Response) => {

    const id_prenotazione = req.params.id_prenotazione

    if ( !isValidObjectId(id_prenotazione) ){
        sendHTTPResponse(res, 401, false, "Impossibile trovare la prenotazione richiesta");
        return
    }


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

    sendHTTPResponse(res, 201, true, "Prenotazione eliminata con successo")

})

router.get('/prenotazioniSlot/:year(\\d{4})-:month(\\d{2})-:day(\\d{2})', checkTokenCircolo, async (req: Request, res: Response) => {
    
    const giorno = new Date(
        +req.params.year,
        +req.params.month - 1,
        +req.params.day
      );

    const mioCircolo = await CircoloModel.findOne({ email: req.utenteAttuale?.email }).exec()

    if (!mioCircolo) {
        sendHTTPResponse(res, 403, false, "Impossibile scaricare i dati del circolo");
        return
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
        idPartita?: string
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
            tipoUtente: prenotazioneCampo.partita == undefined ? TipoAccount.Circolo : TipoAccount.Giocatore,
            partita: prenotazioneCampo.partita
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

// Route per il giocatore che deve accedere a dati di un circolo
router.get('/:idCircolo/partiteAperte', checkTokenGiocatore, async (req: Request, res: Response) => {

    const _data_slot = req.body.data_slot; //TODO: La data è superiore a quella attuale?
    const { idCircolo } = req.params;

    const data_slot = controlloData(res, _data_slot, "Data fornita formalmente errata")
    if ( !data_slot ) return

    if ( !isValidObjectId(idCircolo) ) {
        sendHTTPResponse(res, 400, false, "L'id del circolo fornito non è valido")
        return
    }

    const ex = await CircoloModel.exists({ _id: idCircolo }).exec();
    if ( !ex ) {
        sendHTTPResponse(res, 400, false, "Il circolo richiesto non è stato trovato")
        return
    }

    // I casi sono due: l'utente ha già una prenotazione a suo nome per questo slot,
    // in quel caso imposto `giaPrenotato` a true e ritorno solo quella partita

    let ret_obj: PartiteAperteI = {
        giaPrenotato: false,
        partite: []
    }

    const giocatore_db = await GiocatoreModel.findOne({ email: req.utenteAttuale!.email }).exec();

    if( !giocatore_db ) {
        logger.error("Trovato giocatore con email non corretta, con token valido. Cambiare immediatamente la chiave privata")
        sendHTTPResponse(res, 500, false, "Errore interno, impossibile scaricare lista prenotazioni")
        return
    }

    // Controllo se il giocatore è già iscritto ad una partita per lo slot attuale
    const partitaGiocatore = await PartitaModel.find({ orario: data_slot, circolo: idCircolo, isChiusa: false, giocatori: giocatore_db._id })

    if( partitaGiocatore.length > 0 ) {
        // Stampo la partita alla quale è già iscritto

        ret_obj.giaPrenotato = true;
        ret_obj.partite = await map_to_display(partitaGiocatore)

    } else {
        // Oppure gli mostro la lista di partite aperte alle quali può partecipare

        //TODO: categoria nel range giusto
        const partite = await PartitaModel.find({ orario: data_slot, circolo: idCircolo, isChiusa: false }).exec();

        ret_obj.partite = await map_to_display(partite)
    }

    sendHTTPResponse(res, 200, true, ret_obj)
})

export default router;
