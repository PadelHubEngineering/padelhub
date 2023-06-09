import { Router, Request, Response } from "express";
import { PrenotazioneCampo, PrenotazioneCampoModel } from "../../classes/PrenotazioneCampo";
import { Circolo, CircoloModel, Campo, TipoCampo, GiornoSettimana } from "../../classes/Circolo";
import { TipoAccount } from "../../classes/Utente";
import { checkTokenAmministratore, checkTokenGiocatore, checkTokenCircolo, checkTokenCircoloOAmministratore, checkTokenGiocatoreOCircolo } from "../../middleware/tokenChecker";
import { logger } from "../../utils/logging";
import { Error, isValidObjectId } from "mongoose";
import { convertToObject, isNumericLiteral } from "typescript";
import { error } from "winston";
import { Partita, PartitaModel } from "../../classes/Partita";
import { sendHTTPResponse } from "../../utils/general.utils";

import { DateTime } from  "luxon"
import { GiocatoreModel } from "../../classes/Giocatore";
import { CircoloRetI, PartiteAperteI, c_to_ret, map_to_display } from "../partite/partita.interface";

import { controlloData, controlloDataExpanded } from "../../utils/parameters.utils";
import { inserisciDatiCircolo, registrazioneCircolo } from "./registrazioneCircolo";


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
        sendHTTPResponse(res, 400, false, "Campo non trovato")
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


    const { day, month, year } = req.params

    const giorno = controlloDataExpanded(res, parseInt(year), parseInt(month), parseInt(day))
    if( !giorno ) return

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
            var ind = retObj.campiEsterni.findIndex((campo) => campo.idCampo == prenotazioneCampo.idCampo)
            retObj.campiEsterni[ind].prenotazioni.push(prenotazione)
        }
        else if (campoPrenotato.tipologia == TipoCampo.Interno) {
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
router.get('/:idCircolo/partiteAperte/:year(\\d{4})-:month(\\d{2})-:day(\\d{2})-:hours(\\d{2})-:minutes(\\d{2})', checkTokenGiocatore, async (req: Request, res: Response) => {

    const { year, month, day, hours, minutes } = req.params;
    const _data_slot = `${year}-${month}-${day}T${hours}:${minutes}:00.000Z`;
    const { idCircolo } = req.params;

    const data_slot = controlloData(res, _data_slot, "Data fornita formalmente")
    if ( !data_slot ) return

    if ( !isValidObjectId(idCircolo) ) {
        sendHTTPResponse(res, 400, false, "L'id del circolo fornito non è valido")
        return
    }

    // Scarico i dati del giocatore attuale, quello che ha fatto la richiesta
    const giocatore_db = await GiocatoreModel.findOne({ email: req.utenteAttuale!.email }).exec();

    if( !giocatore_db ) {
        logger.error("Trovato giocatore con email non corretta, con token valido. Cambiare immediatamente la chiave privata")
        sendHTTPResponse(res, 500, false, "Errore interno, impossibile scaricare lista prenotazioni")
        return
    }

    // Scarico i dati del circolo nel quale la partita è organizzata
    const circolo_db = await CircoloModel.findOne({ _id: idCircolo }).exec();
    if ( !circolo_db ) {
        sendHTTPResponse(res, 400, false, "Il circolo richiesto non è stato trovato")
        return
    }

    // I casi sono due: l'utente ha già una prenotazione a suo nome per questo slot,
    // in quel caso imposto `giaPrenotato` a true e ritorno solo quella partita
    let ret_obj: PartiteAperteI = {
        giaPrenotato: false,
        partite: [],
        circolo: c_to_ret(circolo_db),
        isAffiliato: ( circolo_db._id.toString() in giocatore_db.circoliAssociati )
    }

    // Controllo se il giocatore è già iscritto ad una partita per lo slot attuale
    const partitaGiocatore = await PartitaModel.find({ orario: data_slot, circolo: idCircolo, isChiusa: false, giocatori: giocatore_db._id }).exec()

    if( partitaGiocatore.length == 1 ) {
        // Stampo la partita alla quale è già iscritto

        ret_obj.giaPrenotato = true;
        ret_obj.partite = await map_to_display(partitaGiocatore)

    } else if ( partitaGiocatore.length > 1 ){

        sendHTTPResponse( res, 500, false, "Il giocatore non può essere iscritto a due partite contemporaneamente" )
        return

    } else {
        // Oppure gli mostro la lista di partite aperte alle quali può partecipare

        const categoria_giocatore = giocatore_db.calcolaCategoria();

        const partite = await PartitaModel.find({
            orario: data_slot,
            circolo: idCircolo,
            isChiusa: false,
            $and: [
                { categoria_max: { $gte: categoria_giocatore } },
                { categoria_min: { $lte: categoria_giocatore } }
            ]
        }).exec();

        ret_obj.partite = await map_to_display(partite)
    }

    sendHTTPResponse(res, 200, true, ret_obj)
})

//API per registrazione circolo
router.post("/registrazioneCircolo", registrazioneCircolo)

//API per eliminare l'account di un circolo (lo può fare un circolo o un amministratore)
router.delete("/eliminaCircolo", checkTokenAmministratore , async (req: Request, res: Response) => {

    const idCircolo = req.body
    const mioCircolo = await CircoloModel.findById({ idCircolo })

    if (!mioCircolo) { //Circolo non trovato
        sendHTTPResponse(res, 400, false, "Impossibile trovare il circolo");
        return
    }

    const deleted = await CircoloModel.deleteOne({
        email: req.utenteAttuale?.email 
    }).exec();

    if ( deleted.deletedCount == 0 ) {
        sendHTTPResponse(res, 400, false, "Impossibile eliminare il circolo");
        return
    }

    sendHTTPResponse(res, 200, true, "Circolo eliminato con successo")

})

//API per inserimento/modifica dati nell'Area Circolo
router.post("/inserimentoDatiCircolo", checkTokenCircolo, inserisciDatiCircolo)

//API per dare al front-end i dati relativi al circolo (per Area Circolo)
router.get("/datiCircolo", checkTokenCircolo, async (req: Request, res: Response) => {

    const mioCircolo = await CircoloModel.findOne({ email: req.utenteAttuale?.email })

    if (!mioCircolo) { //Circolo non trovato
        sendHTTPResponse(res, 403, false, "Impossibile scaricare i dati del circolo");
        return
    }

    interface OrarioGiornaliero{
        giorno: GiornoSettimana;
        isAperto: boolean;
        orarioApertura: Date;
        orarioChiusura: Date;
    }

    interface DatiCircolo { //Modello dell'API
        anagrafica: {
            nome: string;
            email: string;
            telefono: string | undefined;
            partitaIVA: string | undefined;
            indirizzo: string | undefined;
        },
        struttura: {
            orariStruttura: OrarioGiornaliero[]; 
            durataSlot: number | undefined; 
            quotaAffiliazione: number | undefined;
            prezzoSlotOrario: number | undefined;
            scontoAffiliazione: number | undefined;
            nCampiInterni: number;
            nCampiEsterni: number;
        },
        servizio: {
            serviziAggiuntivi: string[];
        }
           
    }

    var retObj: DatiCircolo = {
        anagrafica:{
            nome: mioCircolo.nome,
            email: mioCircolo.email,
            telefono: mioCircolo.telefono,
            partitaIVA: mioCircolo.partitaIVA,
            indirizzo: mioCircolo.indirizzo,
        },
        struttura:{
            orariStruttura: mioCircolo.orarioSettimanale, 
            durataSlot: mioCircolo.durataSlot, //in minuti
            quotaAffiliazione: mioCircolo.quotaAffiliazione,
            prezzoSlotOrario: mioCircolo.prezzoSlotOrario,
            scontoAffiliazione: mioCircolo.scontoAffiliazione,
            nCampiInterni: 0,
            nCampiEsterni: 0
        },
        servizio: {
            serviziAggiuntivi: mioCircolo.serviziAggiuntivi  
        }
    }

    let nInterni: number = 0
    let nEsterni: number = 0

    mioCircolo.campi.forEach((campo) => {
        if(campo.tipologia == TipoCampo.Esterno){
            nEsterni++
        }
        else if(campo.tipologia == TipoCampo.Interno){
            nInterni++
        }
    });

    //Faccio un check di cosa è undefined
    if(retObj.anagrafica.telefono === undefined) retObj.anagrafica.telefono = " "
    if(retObj.anagrafica.email === undefined) retObj.anagrafica.email = " "
    if(retObj.anagrafica.partitaIVA === undefined) retObj.anagrafica.partitaIVA = " "
    if(retObj.anagrafica.indirizzo === undefined) retObj.anagrafica.indirizzo = " "
    if(retObj.struttura.quotaAffiliazione === undefined) retObj.struttura.quotaAffiliazione = 0
    if(retObj.struttura.prezzoSlotOrario === undefined) retObj.struttura.prezzoSlotOrario = 0
    if(retObj.struttura.scontoAffiliazione === undefined) retObj.struttura.scontoAffiliazione = 0
    if(retObj.struttura.durataSlot === undefined) retObj.struttura.durataSlot = 0


    retObj.struttura.nCampiEsterni= nEsterni
    retObj.struttura.nCampiInterni = nInterni
    
    
    sendHTTPResponse(res, 200, true, retObj)
    return

})

router.get('/:idCircolo', checkTokenGiocatoreOCircolo, async( req: Request, res: Response ) => {

    const { idCircolo } = req.params;

    if ( !isValidObjectId(idCircolo) ){
        sendHTTPResponse(res, 401, false, "Id circolo formalmente errato");
        return
    }

    const circolo_db = await CircoloModel.findOne({ _id: idCircolo }).exec();

    if ( !circolo_db ) {
        sendHTTPResponse(res, 401, false, "Impossibile trovare il circolo richiesto");
        return;
    }

    let retObj: { circolo: CircoloRetI, isAffiliato?: boolean } = {
        circolo: c_to_ret( circolo_db ),
        isAffiliato: undefined
    }

    if( req.utenteAttuale?.tipoAccount === TipoAccount.Giocatore ){

        const giocatore_db = await GiocatoreModel.findOne({ email: req.utenteAttuale.email }).exec();

        if( giocatore_db ){
            retObj.isAffiliato = circolo_db._id.toString() in giocatore_db.circoliAssociati
        }
    }

    sendHTTPResponse( res, 200, true, retObj );
})

export default router;
