import { NextFunction, Request, Response } from "express"
import { Partita, PartitaModel } from "../../classes/Partita"
import { isValidObjectId } from "mongoose"
import { sendHTTPResponse } from "../../utils/general.utils"
import { logger } from "../../utils/logging"
import { Circolo, CircoloModel ,TipoCampo } from "../../classes/Circolo"
import { TipoAccount } from "../../classes/Utente"
import { Giocatore, GiocatoreModel } from "../../classes/Giocatore"
import { PrenotazioneGiocatore, PrenotazioneModel } from "../../classes/PrenotazionePartita"
import { PartitaRetI, p_to_ret } from "./partita.interface"
import { DocumentType } from "@typegoose/typegoose"
import { handlePaymentPrenotazione } from "../../utils/gestionePagamenti.utils"
import { SessionePagamentoModel } from "../../classes/SessionePagamento"
import { DateTime } from "luxon"
import { PrenotazioneCampoModel,PrenotazioneCampo } from "../../classes/PrenotazioneCampo"


//creazione di una partita
const createPartita = async (req: Request, res: Response, next: NextFunction) => {

    const { circolo, categoria_min, categoria_max, orario } = req.body
    const email = req.utenteAttuale?.email
    var giocatore: DocumentType<Giocatore> | null

    if (!email) {
        sendHTTPResponse(res, 404, false, "Giocatore non trovato")
        return
    } else {
        giocatore = await GiocatoreModel.findOne({ email: email })
        console.log(giocatore)
        if (!giocatore?._id) {
            sendHTTPResponse(res, 400, false, "giocatore non valido")
            return
        }


    }
    const date = new Date(orario)
    if(!date){
        sendHTTPResponse(res, 404, false, "formato data errata:(es :2023-03-12T00:00:00.000Z) ")
        return

    }
    if (!isValidObjectId(circolo)) {
        sendHTTPResponse(res, 400, false, "Id circolo formalmente errato")
        return
    }

    //circolo:
    const c = await CircoloModel.findById(circolo)
    console.log(c)
    if(!c){
        sendHTTPResponse(res, 404, false, "circolo inesistente")
        return
    }

    //check se vuoto o pieno
    
    //check date slots
    if(!date){
        sendHTTPResponse(res, 404, false, "formato data errata:(es :2023-03-12T00:00:00.000Z) ")
        return

    }
    

    if(!c.check_coerenza_dataInputSlot(date)){
        sendHTTPResponse(res, 404, false, "Errore data: controllare le date di inizio e fine di uno slot ")
        return
    }
    

    //check aperto
    if(!c.isOpen(date)){
        sendHTTPResponse(res, 404 , false, "Errore data: circolo chiuso")
        return
    }
    
    
    var campi_prenotati= await PrenotazioneCampoModel.find({"circolo": c._id,"inizioSlot" : date}, "idCampo")
    console.log(campi_prenotati)
    if(!campi_prenotati){
        sendHTTPResponse(res, 500, false, "[server] Errore interno")
        return
        
    }
    if(campi_prenotati.length==c.campi.length){
        sendHTTPResponse(res, 400, false, "Tutti i campi del circolo sono già prenotati, riprova con un altro orario")
        return

    }

    //per prendere l'id del campo

    /*
    var id_campi_prenotati : number[] = []
    campi_prenotati.forEach(campo => id_campi_prenotati.push(campo.idCampo))
    console.log(campi_prenotati)
    console.log(id_campi_prenotati)
    var campi_liberi_esterni : number[] = []
    var campi_liberi_interni  : number[] = []


    c.campi.forEach( (campo)=> {if(campo.tipologia==TipoCampo.Esterno){
        campi_liberi_esterni.push(campo.id);
        }else{campi_liberi_interni.push(campo.id)}
    })
    console.log(campi_liberi_interni)
    console.log(campi_liberi_esterni) //fare la pop(dei campi uguali campi_liber.includes(campo_prenotato)) e poi restituire il primo id dell'array: idCampo= array.at[0]

    */
    //creazione prenotazione campo (SOLO DOPO ULTIMA PRENOTAZIONE DOVEééééé???)
    /*
    
    const prenotazione_campo= {
        idCampo : 1, // calcolato da sopra
        partita : partita._id,
        circolo : circolo,
        inizioSlot : date,
        fineSlot : c.get_fineSlot(date).toJSDate(),
        dataPrenotazione : DateTime.now().toJSDate()

    }
    
    const re = await PrenotazioneCampoModel.create(prenotazione_campo)
    if(!re){
        sendHTTPResponse(res, 500, false, "[server] Errore interno")
        return

    }
    console.log(re)
    */
    

    if (categoria_max < categoria_min || (categoria_min < 1 || categoria_min > 5) || (categoria_max < 1 || categoria_max > 5)) {
        sendHTTPResponse(res, 400, false, "Categoria invalida")
        return
    }

    const partita = new PartitaModel({
        giocatori: [],
        circolo: circolo,
        categoria_min: categoria_min,
        categoria_max: categoria_max,
        orario: orario

    })


    let flag = 0;
    return await PartitaModel.create(partita)
        .then(async function (partita) {
            flag = 1
            
            let costo = await partita.getPrezzo(giocatore)
            const prenotazione = new PrenotazioneModel({
                partita: partita.id,
                giocatore: giocatore?._id,//giocatori.at(0) as String,
                dataPrenotazione: orario,
                costo: costo,
                pagato: false
            })
            const p = await PrenotazioneModel.create(prenotazione)
            //creazione prenotazione_campo

            const prenotazione_campo= {
                idCampo : 1, // calcolato da sopra
                partita : partita._id,
                circolo : circolo,
                inizioSlot : date,
                fineSlot : c.get_fineSlot(date).toJSDate(),
                dataPrenotazione : DateTime.now().toJSDate()
        
            }
            
            const re = await PrenotazioneCampoModel.create(prenotazione_campo)
            if(!re){
                sendHTTPResponse(res, 500, false, "[server] Errore interno")
                return
        
            }
            console.log(re)
            ///

            //Pagamento
            const circoloInfo = await partita.getCircolo()
            if (circoloInfo) {
                if (circoloInfo.paymentId) {
                    const link = await handlePaymentPrenotazione(circoloInfo.paymentId, costo!, p._id.toString(), partita.id)
                    //console.log(link)
                    if (link) {
                        SessionePagamentoModel.saveCodice(link.id, prenotazione._id)
                        sendHTTPResponse(res, 200, true, { url: link.url })
                        return
                    }
                }
            }
        })
        .catch(async function (error) { if (flag) { await PartitaModel.deleteOne(partita._id); console.log("Eliminato con successo") } sendHTTPResponse(res, 500, false, "[server] Errore interno") });
}

//lettura di una singola partita
const readPartita = async (req: Request, res: Response, next: NextFunction) => {

    const id = req.params.PartitaId
    if (!isValidObjectId(id)) {
        sendHTTPResponse(res, 401, false, "ID partita invalido")
        return
    }

    await PartitaModel.findById(id)
        .populate("giocatori")
        .populate("circolo")
        .then(partita => {

            if (!partita) {
                sendHTTPResponse(res, 404, false, "Partita inesistente")
                return
            }

            let ret_partita: PartitaRetI = p_to_ret(
                partita,
                partita.giocatori as DocumentType<Giocatore>[],
                partita.circolo as DocumentType<Circolo>
            );

            sendHTTPResponse(res, 200, true, ret_partita)
        })
        .catch((error) => { sendHTTPResponse(res, 500, false, "[server] Errore interno") })
}

//lettura di tutte le partite
const readAllPartite = async (req: Request, res: Response, next: NextFunction) => {
    const tipoAccount = req.utenteAttuale?.tipoAccount;
    const email = req.utenteAttuale?.email

    if (tipoAccount == TipoAccount.Giocatore) {
        //console.log("giocatore")
        return await PartitaModel.find().populate("giocatori")
            .then(partite => sendHTTPResponse(res, 200, true, partite))
            .catch((error) => sendHTTPResponse(res, 500, false, "[server] Errore interno"))

    } else if (tipoAccount == TipoAccount.Circolo) {
        const c_id = await CircoloModel.findOne({ email: email })
        if (c_id == null) {
            sendHTTPResponse(res, 500, false, "[server] Errore interno")
            return
        }

        return await PartitaModel.find({ circolo: c_id?.id }).populate("giocatori")
            .then(partite => sendHTTPResponse(res, 200, true, partite))
            .catch((error) => sendHTTPResponse(res, 500, false, "[server] Errore interno"))
    }
}


//eliminazione della partita
const deletePartita = async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.PartitaId;
    if (!isValidObjectId(id)) {
        sendHTTPResponse(res, 401, false, "ID partita invalido")
        return
    }

    return await PartitaModel.findByIdAndDelete(id)
        .then((partita) => partita ? sendHTTPResponse(res, 201, true, partita) : sendHTTPResponse(res, 404, false, "Nessuna partita trovata"))
        .catch((error) => sendHTTPResponse(res, 500, false, "[server] Errore interno"))


}

//aggiunta di un altro giocatore alla partita
const updatePartita = async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.PartitaId;
    const email = req.utenteAttuale?.email
    var giocatore: DocumentType<Giocatore> | null
    if (!email) {
        sendHTTPResponse(res, 404, false, "Giocatore non trovato")
        return
    } else {
        giocatore = await GiocatoreModel.findOne({ email: email })
        //console.log(giocatore)
        if (!giocatore?._id || giocatore == null) {
            sendHTTPResponse(res, 400, false, "giocatore non valido")
            return
        }

    }

    if (!isValidObjectId(id)) {
        return sendHTTPResponse(res, 401, false, "ID partita invalido")
    }

    //check level
    return await PartitaModel.findById(id)
        .then(async (partita) => {
            if (partita) {
                if (partita?.checkChiusa()) {
                    sendHTTPResponse(res, 401, false, "Partita già al completo")
                    return
                } else {
                    if (await partita.checkLevel(giocatore) == false) {
                        sendHTTPResponse(res, 401, false, "Non puoi partecipare a questa partita : Livello invalido")
                        return
                    }
                    //giocatore già presente
                    if(giocatore!= null){
                        if (partita.giocatori.includes(giocatore._id)){
                            sendHTTPResponse(res, 400, false, "Giocatore già registrato alla partita")
                            return 
                        }
                    }
     
                    const p = await PartitaModel.findById(id).then((p) => p?.aggiungi_player(giocatore))
                    //check se la partita è chiusa così da creare la prenotazione del campo

                    console.log(p)
                    console.log(partita.orario)
                    

                    //crea prenotazione
                    if (p) {
                        let costo = await partita.getPrezzo(giocatore)
                        const prenotazione = new PrenotazioneModel({
                            partita: partita.id,
                            giocatore: giocatore,
                            dataPrenotazione: partita.orario,
                            costo: costo,
                            pagato: false
                        })
                        console.log("qui")

                        try {
                            await PrenotazioneModel.create(prenotazione)
                        } catch (err) {
                            console.log(err)
                            sendHTTPResponse(res, 500, false, "[server] Errore interno1")
                            return
                        }

                        //Pagamento
                        const circoloInfo = await partita.getCircolo()
                        if (circoloInfo) {
                            if (circoloInfo.paymentId) {
                                const link = await handlePaymentPrenotazione(circoloInfo.paymentId, costo!, p._id.toString(), partita.id)
                                //console.log(link)
                                if (link) {
                                    SessionePagamentoModel.saveCodice(link.id, prenotazione._id)
                                    sendHTTPResponse(res, 200, true, { url: link.url })
                                    return
                                }
                            }
                        }
                    }
                    sendHTTPResponse(res, 201, true, p as Partita)
                    return
                }
            } else {
                sendHTTPResponse(res, 404, false, "ID partita invalido")
                return

            }
        })
        .catch((error) => { sendHTTPResponse(res, 500, false, "[server] Errore interno2"); console.log(error) })


}

export { createPartita, readPartita, readAllPartite, deletePartita, updatePartita }
