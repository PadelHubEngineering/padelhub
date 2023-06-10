import { Router, Request, Response } from "express";
import { Genere, Giocatore, GiocatoreModel } from "../../classes/Giocatore";
import { sendHTTPResponse } from "../../utils/general.utils";
import { controlloData, controlloEmail, controlloInt, controlloNickname, controlloNomeCognome, controlloPassword, controlloRegExp, controlloStrEnum, controlloTelefono } from "../../utils/parameters.utils";
import { logger } from "../../utils/logging";
import base64 from "@hexagon/base64";
import { MongoServerError } from "mongodb";
import { inviaEmailConferma } from "../../utils/email.utils";
import { Ref, DocumentType } from "@typegoose/typegoose";
import { Utente } from "../../classes/Utente";
import { CodiceConferma, CodiceConfermaModel } from "../../classes/CodiceConferma";
import { handlePaymentPrenotazione } from "../../utils/gestionePagamenti.utils";
import { SessionePagamento, SessionePagamentoModel } from "../../classes/SessionePagamento";
import Stripe from 'stripe';
import { PrenotazioneGiocatore, PrenotazioneModel } from "../../classes/PrenotazionePartita";

const router = Router();

router.post('/webhook', async (req: Request, res: Response) => {
    const event = req.body;

    // Handle the event
    // switch (event.type) {
    //     case 'payment_intent.succeeded':
    //         const paymentIntent = event.data.object;
    //         console.log('PaymentIntent was successful!');
    //         break;
    //     case 'payment_method.attached':
    //         const paymentMethod = event.data.object;
    //         console.log('PaymentMethod was attached to a Customer!');
    //         break;
    //     case 'checkout.session.completed':
    //         console.log(event.data.object)
    //         if
    //     // ... handle other event types
    //     default:
    //         console.log(`Unhandled event type ${event.type}`);
    // }
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
        while(count < 10 && session == null){ //riprova perchè gli eventi potrebbero essere troppo ravvicinati e la scrittura a db non ancora avvenuta
            session = await SessionePagamentoModel.findOne({ idIntent: event.data.object.payment_intent})
            count++;
        }
        //console.log(session)
        if(session){
            session = await session.addCharge(event.data.object.id)
            const prenotazione = (await PrenotazioneModel.findById(session.prenotazione))
            if(prenotazione){
                await prenotazione.pagaPrenotazione()
            }
        }
    }
    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true });
})
router.get("/testPagamenti", async (req: Request, res: Response) => {
    //const link = await handlePaymentPrenotazione("acct_1NG6pvFk2nvmmn2V", 20);
    //const session = await SessionePagamentoModel.saveCodice(link?.id!, "aaa")
    //sendHTTPResponse(res, 200, true, { link: link?.url })
    return;
})


export default router;
