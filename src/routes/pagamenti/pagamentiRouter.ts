import { Router, Request, Response } from "express";
import { Genere, Giocatore, GiocatoreModel } from "../../classes/Giocatore";
import { sendHTTPResponse } from "../../utils/general.utils";
import { controlloData, controlloEmail, controlloInt, controlloNickname, controlloNomeCognome, controlloPassword, controlloRegExp, controlloStrEnum, controlloTelefono } from "../../utils/parameters.utils";
import { logger } from "../../utils/logging";
import base64 from "@hexagon/base64";
import { MongoServerError } from "mongodb";
import { inviaEmailConferma } from "../../utils/email.utils";
import { Ref, DocumentType, pre } from "@typegoose/typegoose";
import { Utente } from "../../classes/Utente";
import { CodiceConferma, CodiceConfermaModel } from "../../classes/CodiceConferma";
import { handlePaymentPrenotazione } from "../../utils/gestionePagamenti.utils";
import { SessionePagamento, SessionePagamentoModel } from "../../classes/SessionePagamento";
import Stripe from 'stripe';
import { PrenotazioneGiocatore, PrenotazioneModel } from "../../classes/PrenotazionePartita";
import { PartitaModel } from "../../classes/Partita";
import { DateTime } from "luxon";
import { PrenotazioneCampoModel } from "../../classes/PrenotazioneCampo";
import { CircoloModel, TipoCampo } from "../../classes/Circolo";
import { handleRefundPrenotazione } from "../../utils/gestionePagamenti.utils";

const router = Router();

router.post('/webhook', async (req: Request, res: Response) => {
    const event = req.body;

    if (event.type == 'checkout.session.completed') {
        const result = await SessionePagamentoModel.isValid(event.data.object.payment_link)
        //console.log(result)
        if (result) {
            await result.addIntent(event.data.object.payment_intent)
        }
    }
    if (event.type == 'charge.succeeded') {
        //console.log("charge")
        //console.log(event.data.object.payment_intent)
        let count = 0;
        let session = null;
        while (count < 10 && session == null) { //riprova perchè gli eventi potrebbero essere troppo ravvicinati e la scrittura a db non ancora avvenuta
            session = await SessionePagamentoModel.findOne({ idIntent: event.data.object.payment_intent })
            count++;
        }
        //console.log(session)
        if (session) {
            session = await session.addCharge(event.data.object.id)
            const prenotazione = (await PrenotazioneModel.findById(session.prenotazione))
            if (prenotazione) {
                const partita = await PartitaModel.findById(prenotazione?.partita)
                const circolo = await CircoloModel.findById(partita?.circolo)
                if (partita && circolo) {
                    partita.aggiungi_player(prenotazione.giocatore)
                    if (partita.checkChiusa()) {
                        var campi_prenotati= await PrenotazioneCampoModel.find({"circolo": circolo._id,"inizioSlot" : partita.orario}, "idCampo")
                        console.log(campi_prenotati)
                        if(!campi_prenotati){
                            sendHTTPResponse(res, 500, false, "[server] Errore interno")
                            return
                            
                        }
                        if(campi_prenotati.length==circolo.campi.length){
                            sendHTTPResponse(res, 400, false, "Tutti i campi del circolo sono già prenotati, riprova con un altro orario")
                            return
                    
                        }
                    
                        //per prendere l'id del campo
                    
                        
                        var id_campi_prenotati : number[] = []
                        campi_prenotati.forEach(campo => id_campi_prenotati.push(campo.idCampo))
                        console.log(campi_prenotati)
                        console.log(id_campi_prenotati)
                    
                        var campi_liberi_esterni : number[] = []
                        var campi_liberi_interni  : number[] = []
                       
                        circolo.campi.forEach(campo => {
                            let i =0
                            let free = true
                            for(let i =0 ;i< id_campi_prenotati.length;i++){
                                if(campo.id==id_campi_prenotati.at(i)){
                                    free=false
                                }
                            }
                            if (free){
                                if(campo.tipologia==TipoCampo.Esterno){
                                    console.log(campo.id)
                                    console.log(campi_liberi_esterni.push(campo.id))
                                }else{
                                    console.log(campo.id)
                                    campi_liberi_interni.push(campo.id)
                    
                                }
                            }
                        })
                        console.log(campi_liberi_interni)
                        console.log(campi_liberi_esterni)
                        
                        let id_campo : Number | undefined
                        let error_message = ""
                        //check tipo campo
                        if(!partita.tipocampo){
                            return sendHTTPResponse(res, 400, false, "Tipo campo non indicato")
                        
                        }else if(partita.tipocampo == TipoCampo.Esterno){
                            if(!campi_liberi_esterni.length){
                                error_message = "Nessun campo Esterno è disponibile in questo slot"
                            }else{
                                id_campo = campi_liberi_interni.at(0)
                            }
                        }else{
                            if(!campi_liberi_interni){
                                error_message = "Nessun campo Interno è disponibile in questo slot"
                            }else{
                                id_campo = campi_liberi_interni.at(0)

                            }
                        }
                        console.log(error_message)
                        if(error_message!=""){
                            while(await PartitaModel.exists(partita._id)){
                                partita.giocatori.forEach(async(g) =>{
                                    let risposta = await prenotazione.deleteOne()
                                    if (risposta) {
                                        const session = await SessionePagamentoModel.findOne({ prenotazione: prenotazione._id })
                                        if (session!=null){
                                            handleRefundPrenotazione(session.idCharge).then(() => partita.rimuovi_player(g._id)).catch(err => console.log("Errore refound"));
                                        }
                                    }
                                            
                                    
                        
                                })
                            }
                            return sendHTTPResponse(res,400,false,error_message)
                        }
                        
                        const prenotazione_campo= {
                            idCampo : id_campo, // calcolato da sopra
                            partita : partita._id,
                            circolo : circolo.id,
                            inizioSlot : partita.orario,
                            fineSlot : circolo.get_fineSlot(partita.orario).toJSDate(),
                            dataPrenotazione : DateTime.now().toJSDate()
                    
                        }
                        
                        const re = await PrenotazioneCampoModel.create(prenotazione_campo)
                        if(!re){
                            sendHTTPResponse(res, 500, false, "[server] Errore interno")
                            return
                    
                        }
                        
                        console.log(re)
                        

                    }
                }
            }

            if (prenotazione) {
                await prenotazione.pagaPrenotazione()
            }
        }
    }
    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true });

})


export default router;
