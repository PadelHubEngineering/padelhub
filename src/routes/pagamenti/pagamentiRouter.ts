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
import { CircoloModel } from "../../classes/Circolo";

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

                        
                        const prenotazione_campo= {
                            idCampo : 1, // calcolato da sopra
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
