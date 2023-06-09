import { Circolo, CircoloModel, GiornoSettimana, TipoCampo } from "../../classes/Circolo"
import { sendHTTPResponse } from "../../utils/general.utils"
import { logger } from "../../utils/logging"
import { controlloStringa, controlloEmail, controlloTelefono, controlloPassword, controlloNomeCognome, controlloInt, controlloNumber } from "../../utils/parameters.utils"
import { Request, Response } from "express"
import { MongoServerError } from "mongodb";
import { inviaEmailConferma, inviaEmailOnboarding } from "../../utils/email.utils"
import { createConnectedAccount, getOnboardingLink } from "../../utils/gestionePagamenti.utils"
import Stripe from 'stripe';
import { CodiceConferma, CodiceConfermaModel } from "../../classes/CodiceConferma"


//CONTROLLA SE FUNZIONA SE NON VENGONO INSERITI I DATI NON OBBLIGATORI
export async function registrazioneCircolo(req: Request, res: Response) {

    //Prendo i dati che mi interessano dalla richiesta 
    const { nome, email, telefono, password } = req.body

    logger.info(`Tentativo registrazione circolo: ${nome}, ${email}`)

    //Controllo i dati 
    if (!controlloNomeCognome(res, nome, false, "Nome")) return
    if (!controlloEmail(res, email, "Email")) return
    if (telefono != undefined)
        if (!controlloTelefono(res, telefono, "Telefono")) return
    if (!controlloPassword(res, password, "Password")) return

    //Posso inviare i dati al db 
    // let circolo_db: Ref<Circolo>;

    let circolo: Circolo;
    try {
        circolo = new Circolo(nome, email, password, telefono);

        // circolo_db =
        circolo = await CircoloModel.create(circolo)
        //console.log(circolo)
    } catch (error: any) {

        logger.info(error.message);

        if (error instanceof MongoServerError) {
            const err = error as MongoServerError;

            logger.info(`Errore salvataggio utente: ${email} sul database: ${err.message}`)

            switch (err.code) {
                case 11000:
                    const key = Object.keys(err.keyValue)
                    if (key.length > 0)
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

    console.log("provaprovaprova", circolo)

    logger.info(`Creato nuovo circolo: ${nome}, ${email}`)

    const payID: string | null = await createConnectedAccount(circolo.email);

    if (payID) {
        circolo = await circolo.setPaymentID(payID)
        if (circolo.paymentId)
            getOnboardingLink(circolo.paymentId, new URL(process.env.PAYMENT_REDIRECT_URL!)).then(async (link: Stripe.AccountLink | null) => {
                //Posso inviare email di conferma all'utente
                let codice_conferma_utente = new CodiceConferma(circolo._id);
                codice_conferma_utente = await CodiceConfermaModel.create(codice_conferma_utente)
                const invio = await inviaEmailConferma(codice_conferma_utente._id.toString(), circolo._id.toString())
                if (link != null && link.url != undefined) {
                    const onboarding = await inviaEmailOnboarding(new URL(link?.url.toString()), circolo._id.toString())
                    sendHTTPResponse(res, 201, true, "Email di conferma inviata")
                    return
                }
            })
    }
    else{
        sendHTTPResponse(res, 500, false, "Errore invio email")
        return
    }
}

//INSERISCE/AGGIORNA I DATI NEL CIRCOLO NEL DB
export async function inserisciDatiCircolo(req: Request, res: Response) {


    //Prendo i dati che mi interessano dalla richiesta 
    const {
        anagrafica,
        struttura,
        servizio
    } = req.body

    if(anagrafica === undefined || struttura === undefined  || servizio === undefined ){
        sendHTTPResponse(res, 403, false, "Impossibile aggiornare circolo: dati mancanti")
        return
    }

    const { nome, telefono, indirizzo, partitaIVA } = anagrafica
    const { orariStruttura, durataSlot, quotaAffiliazione, prezzoSlotOrario, scontoAffiliazione, nCampiEsterni, nCampiInterni } = struttura
    const { serviziAggiuntivi } = servizio

    if(nome === undefined  || telefono === undefined  || indirizzo === undefined  || partitaIVA === undefined  || orariStruttura === undefined  || durataSlot  === undefined || quotaAffiliazione === undefined || prezzoSlotOrario === undefined  || scontoAffiliazione === undefined  || nCampiInterni === undefined  || nCampiEsterni === undefined  || serviziAggiuntivi === undefined  ){
        sendHTTPResponse(res, 403, false, "Impossibile aggiornare circolo: dati mancanti")
        return
    }


    // Scarico i dati attuali del mio circolo
    const mioCircolo = await CircoloModel.findOne({ email: req.utenteAttuale?.email })

    console.log("MIOCIRCOLO: ",mioCircolo)

    if (!mioCircolo) {
        sendHTTPResponse(res, 401, false, "Impossibile scaricare i dati del circolo")
        return
    }

    interface Campo {
        id: number,
        tipologia: TipoCampo
    }

    interface Giorno {
        giorno: GiornoSettimana;
        isAperto: boolean;
        orarioApertura: Date;
        orarioChiusura: Date;
    }

    interface DatiCircolo {
        nome: string;
        telefono: string | undefined;
        partitaIVA: string | undefined;
        indirizzo: string | undefined;
        orarioSettimanale: Giorno[];
        durataSlot: number; //in minuti
        quotaAffiliazione: number | undefined;
        prezzoSlotOrario: number | undefined;
        scontoAffiliazione: number | undefined;
        campi: Campo[]
        serviziAggiuntivi: string[]
    }


    var nInterni: number = 0
    var nEsterni: number = 0
    var arrInterni: Campo[] = []
    var arrEsterni: Campo[] = []

    //Osservo quanti sono effettivamenti i campi correnti e li divido in due array
    mioCircolo.campi.forEach((campo) => {
        if (campo.tipologia == TipoCampo.Esterno) {
            arrEsterni.push(campo);
            nEsterni++;
        }
        else if (campo.tipologia == TipoCampo.Interno) {
            arrInterni.push(campo);
            nInterni++;
        }
    });



    //Ordino gli array sulla base dei loro id
    arrEsterni.sort(function (campo1, campo2) {
        if (campo1.id < campo2.id) return -1;
        if (campo1.id > campo2.id) return 1;
        else return 0;
    });
    arrInterni.sort(function (campo1, campo2) {
        if (campo1.id < campo2.id) return -1;
        if (campo1.id > campo2.id) return 1;
        else return 0;
    });



    //Creo l'oggetto con i campi che andranno salvati sul db
    var objToSave: DatiCircolo = { //Per ora è vuoto
        nome: "",
        telefono: "",
        partitaIVA: "",
        indirizzo: "",
        orarioSettimanale: [],
        durataSlot: 0, //in minuti
        quotaAffiliazione: 0,
        prezzoSlotOrario: 0,
        scontoAffiliazione: 0,
        campi: [],
        serviziAggiuntivi: []
    }

    //Controllo cosa è effettivamente cambiato e lo imposto
    //NOME
    if (nome != mioCircolo.nome && nome != undefined) {
        if (!controlloNomeCognome(res, nome, false, "Nome")) return
        objToSave.nome = nome;
    } else {
        objToSave.nome = mioCircolo.nome;
    }

    //TELEFONO
    if (telefono != mioCircolo.telefono && telefono != undefined) {
        if (!controlloTelefono(res, telefono, "Telefono")) return
        objToSave.telefono = telefono;
    } else {
        objToSave.telefono = mioCircolo.telefono;
    }

    //PARTITA IVA - da sistemare il check
    if (partitaIVA != mioCircolo.partitaIVA && partitaIVA != undefined) {
        if (!controlloStringa(res, partitaIVA, false, "PartitaIVA")) return
        objToSave.partitaIVA = partitaIVA;
    } else {
        objToSave.partitaIVA = mioCircolo.partitaIVA;
    }

    //INDIRIZZO
    if (indirizzo != mioCircolo.indirizzo && indirizzo != undefined) {
        if (!controlloStringa(res, indirizzo, false, "Indirizzo")) return
        objToSave.indirizzo = indirizzo;
    } else {
        objToSave.indirizzo = mioCircolo.indirizzo;
    }

    //DURATA SLOT
    if (durataSlot != mioCircolo.durataSlot && durataSlot != undefined) {
        if (!controlloInt(res, durataSlot, 30, 180, true, "Durata slot")) return
        objToSave.durataSlot = durataSlot;
    } else {
        objToSave.durataSlot = mioCircolo.durataSlot;
    }

    //QUOTA ISCRIZIONE
    if (quotaAffiliazione != mioCircolo.quotaAffiliazione && quotaAffiliazione != undefined) {
        if (!controlloNumber(res, quotaAffiliazione, "Aggiornamento dati fallito", "quota affiliazione")) return
        objToSave.quotaAffiliazione = quotaAffiliazione;
    } else {
        objToSave.quotaAffiliazione = mioCircolo.quotaAffiliazione;
    }

    //QUOTA PARTITA STANDARD
    if (prezzoSlotOrario != mioCircolo.prezzoSlotOrario && prezzoSlotOrario != undefined) {
        if (!controlloNumber(res, prezzoSlotOrario, "Aggiornamento dati fallito", "prezzo slot partita")) return
        objToSave.prezzoSlotOrario = prezzoSlotOrario;
    } else {
        objToSave.prezzoSlotOrario = mioCircolo.prezzoSlotOrario;
    }

    //SCONTO AFFILIAZIONE
    if (scontoAffiliazione != mioCircolo.scontoAffiliazione && scontoAffiliazione != undefined) {
        if (!controlloInt(res, scontoAffiliazione, 0, 100, true, "Scontro affiliazione")) return
        objToSave.scontoAffiliazione = scontoAffiliazione;
    } else {
        objToSave.scontoAffiliazione = mioCircolo.scontoAffiliazione;
    }


    //ORARIO
    if (orariStruttura != undefined) {
        orariStruttura.forEach((giorno: any) => {
            var g: Giorno = {
                giorno: GiornoSettimana.Lunedi,
                isAperto: false,
                orarioApertura: new Date("1899-12-31T00:00:00.000+00:00"),
                orarioChiusura: new Date("1899-12-31T00:00:00.000+00:00")
            }

            g.giorno = <GiornoSettimana>giorno.giorno;

            if (giorno.isAperto) {
                g.isAperto = true
                g.orarioApertura = new Date(giorno.orarioApertura),
                    g.orarioChiusura = new Date(giorno.orarioChiusura)
            }

            objToSave.orarioSettimanale.push(g)
        })
    }


    if (!controlloInt(res, nCampiInterni, 0, 50, true, "Aggiornamento dati fallito")) return
    if (!controlloInt(res, nCampiEsterni, 0, 50, true, "Aggiornamento dati fallito")) return


    //CAMPI INTERNI
    if (nCampiInterni != nInterni && nCampiInterni != undefined) { //Se cambia il numero di campi interni

        let difference = Math.abs(nCampiInterni - nInterni) //Trovo i campi di differenza 


        if (nCampiInterni > nInterni) { //Devo aggiungere campi interni
            for (let i = 0; i < difference; i++) {
                arrInterni.push({ id: nInterni + nEsterni + 1, tipologia: TipoCampo.Interno });
                nInterni++;
            }
        }
        else if (nCampiInterni < nInterni) { //Devo togliere campi interni
            for (let i = 0; i < difference; i++) {
                arrInterni.pop();
                nInterni--;
            }
        }

    }

    //CAMPI ESTERNI
    if (nCampiEsterni != nEsterni && nCampiEsterni != undefined) { //Se cambia il numero di campi interni

        let difference = Math.abs(nCampiEsterni - nEsterni) //Trovo i campi di differenza 


        if (nCampiEsterni > nEsterni) { //Devo aggiungere campi esterni
            for (let i = 0; i < difference; i++) {
                arrEsterni.push({ id: nInterni + nEsterni + 1, tipologia: TipoCampo.Esterno });
                nEsterni++;
            }
        }
        else if (nCampiEsterni < nEsterni) { //Devo togliere campi esterni
            for (let i = 0; i < difference; i++) {
                arrEsterni.pop();
                nEsterni--;
            }
        }

    }

    //Concateno i due array per il risultato finale
    objToSave.campi = arrInterni.concat(arrEsterni)


    //SERVIZI AGGIUNTIVI
    serviziAggiuntivi.forEach((servizio: string) => {
        if (!controlloStringa(res, servizio, true, "Aggiornamento dati fallito")) return
        objToSave.serviziAggiuntivi.push(servizio)
    })


    //Aggiorno il DB
    let circolo = null;
    try {
        logger.info('Cerco di aggiornare i dati')
        circolo = await CircoloModel.findOneAndUpdate({ email: req.utenteAttuale?.email }, objToSave, { new: true });

    } catch (error: any) {

        logger.info(error.message);

        if (error instanceof MongoServerError) {
            const err = error as MongoServerError;

            logger.info(`Errore aggiornamento circolo sul database: ${err.message}`)

            switch (err.code) {
                case 11000:
                    const key = Object.keys(err.keyValue)
                    if (key.length > 0)
                        sendHTTPResponse(res, 500, false, `Esiste gia\` un utente con ${key} uguale a "${err.keyValue[key[0]]}"`)
                    else
                        sendHTTPResponse(res, 500, false, `Utente duplicato`)
                    return;
                default:
            }
        }

        sendHTTPResponse(res, 500, false, "Errore interno, impossibile aggiornare i dati del circolo")
        return;

    }

    if( circolo !== null && circolo.isCircoloValidato() ) {

        circolo.validato = true;

        await circolo.save();
    }

    logger.info(`Aggiornato il circolo: ${nome}`)
    sendHTTPResponse(res, 201, true, "Circolo aggiornato correttamente")

}
