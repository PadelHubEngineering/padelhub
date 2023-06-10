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
import { handlePaymentPrenotazione } from "../../utils/gestionePagamenti.utils";
import { SessionePagamento, SessionePagamentoModel } from "../../classes/SessionePagamento";
import Stripe from 'stripe';

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
    if(event.type == 'checkout.session.completed'){
        console.log(await SessionePagamentoModel.isValid(event.type.payment_link))
    }
    if(event.type == 'charge.succeeded'){
        console.log(event.type.payment_intent)
    }
    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true });
})
router.get("/testPagamenti", async (req: Request, res: Response) => {
    const link = await handlePaymentPrenotazione("acct_1NG6pvFk2nvmmn2V", 20);
    //const session = await SessionePagamentoModel.saveCodice(link?.id!, "aaa")
    sendHTTPResponse(res, 200, true, { link: link?.url })
    return;
})


export default router;
