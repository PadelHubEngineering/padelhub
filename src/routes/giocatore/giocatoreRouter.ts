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
import { checkTokenGiocatore } from "../../middleware/tokenChecker";
import { CircoloModel, TipoCampo } from "../../classes/Circolo";
import { PrenotazioneCampo, PrenotazioneCampoModel } from "../../classes/PrenotazioneCampo";
import { Partita, PartitaModel } from "../../classes/Partita";
import { DateTime, FixedOffsetZone, Interval } from "luxon"
import mongoose from "mongoose";



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

interface Slot{
    inizioSlot: string;
    fineSlot: string;
    disponibile: boolean;
    partiteAperte: number;  
}

interface DatiSlot{
    circolo: {
        _id: mongoose.Types.ObjectId,
        orarioApertura: string;
        orarioChiusura: string;
        durataSlot: number;
    };
    slots: Slot[];
}

//Api che restituisce la dispobilità dei vari slot orari dei circoli
router.get('/getSlot', checkTokenGiocatore, async (req: Request, res: Response) => {

    //Prendo dalla request --> data, circolo, tipo di campo, categoria del giocatore
    const {idCircolo, data, campo} = req.query

    if(!idCircolo){
        sendHTTPResponse(res, 403, false, "Errore ID circolo");
        return
    }
    if (!DateTime.fromFormat(<any>data, "yyyy-mm-dd").isValid) {
        sendHTTPResponse(res, 400, false, "data non valida")
        return
    }
    if(!campo){
        sendHTTPResponse(res, 403, false, "Errore tipo campo");
        return
    }

    const tipoCampo: TipoCampo = (campo == 'Interno') ? TipoCampo.Interno : TipoCampo.Esterno
    const giocatore_db = await GiocatoreModel.findOne({ email: req.utenteAttuale?.email }).exec()

    if(!giocatore_db){
        sendHTTPResponse(res, 403, false, "Giocatore non trovato");
        return 
    }

    const livello = giocatore_db.calcolaCategoria()

    const _data = DateTime.fromISO(<any>data);
    console.log(_data.toJSDate())

    let dataPrima = _data.toJSDate(); dataPrima.setDate(_data.toJSDate().getDate()-1)
    let giorno = dataPrima.getDay()

    //Trovo gli orari del circolo 
    const mioCircolo = await CircoloModel.findById(idCircolo).exec();

    //Se il circolo non esiste
    if(!mioCircolo){
        sendHTTPResponse(res, 403, false, "Impossibile trovare il circolo");
        return
    }

    //Se il circolo quel giorno è chiuso
    if(!mioCircolo.orarioSettimanale[giorno].isAperto){
        sendHTTPResponse(res, 403, false, "Questo giorno il circolo è chiuso");
        return
    }

    const orarioApertura = DateTime
        .fromJSDate(mioCircolo.orarioSettimanale[giorno].orarioApertura, { zone: "UTC"})
        .set({ day: _data.day, month: _data.month, year: _data.year })

    const orarioChiusura = DateTime
        .fromJSDate(mioCircolo.orarioSettimanale[giorno].orarioChiusura, { zone: "UTC"})
        .set({ day: _data.day, month: _data.month, year: _data.year })

    let retObj: DatiSlot = {
        circolo: {
            _id: mioCircolo._id, 
            orarioApertura: orarioApertura.toJSON()!,
            orarioChiusura: orarioChiusura.toJSON()!,
            durataSlot: mioCircolo.durataSlot
        },
        slots: []
    }


    let nCampiTipo = 0

    //Trovo quanti campi del tipo indicato sono presenti nella struttura
    mioCircolo.campi.forEach((campo)=>{
        if(campo.tipologia === tipoCampo) nCampiTipo++
    })


    //Formo due date con l'ora giusta
    let dataJS = _data.toJSDate()
    
    const interval = Interval.fromDateTimes(
        orarioApertura,
        orarioChiusura
    );

    const real_intervals = interval
        .splitBy({ minutes: mioCircolo.durataSlot })

    for( const { start, end } of real_intervals ) {

        if( start == null || end == null) continue;

        let s: Slot = {
            inizioSlot: start.toJSON()!,
            fineSlot: end.toJSON()!,
            disponibile: true,
            partiteAperte: 0
        }

        //Sono in uno slot 
        const prenotazioniSlot: PrenotazioneCampo[] = await PrenotazioneCampoModel.find({
            circolo: mioCircolo._id,
            inizioSlot: start.toJSDate()
        }).exec()

        let nCampiOccupati=0

        //Controllo quanti risultati ho avuto
        if(prenotazioniSlot.length >= nCampiTipo){
            prenotazioniSlot.forEach((prenotazione)=>{
                mioCircolo.campi.forEach((campo)=>{
                    if(campo.id === prenotazione.idCampo){
                        if(campo.tipologia === tipoCampo)
                            nCampiOccupati++;
                    }
                })
            })
            if(nCampiTipo === nCampiOccupati) {s.disponibile = false}
        }
            else {
            
            //Devo controllare se ci sono partite aperte
            const partiteAperte: Partita[] = await PartitaModel.find({
                circolo: mioCircolo._id,
                tipoCampo: tipoCampo,
                orario: new Date(s.inizioSlot),
                categoria_max: {$gte: livello},
                categoria_min: {$lte: livello}
            }).exec()


            if(partiteAperte.length>0){
                let nPartiteAperte=0

                partiteAperte.forEach((partita)=>{
                    if(partita.isChiusa===false) nPartiteAperte++;
                })

                s.partiteAperte = nPartiteAperte
            }
        }


        retObj.slots.push(s);
    }

    sendHTTPResponse(res, 200, true, retObj)
    return 

})



export default router;
