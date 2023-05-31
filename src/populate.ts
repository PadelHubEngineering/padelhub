import mongoose from "mongoose";
import { logger } from "./utils/logging";
import { UtenteModel } from "./classes/Utente";
import { Partita, PartitaModel } from "./classes/Partita";
import { Genere, Giocatore, GiocatoreModel } from "./classes/Giocatore";
import { Circolo, CircoloModel, GiornoSettimana, TipoCampo } from "./classes/Circolo";
import { PrenotazioneCampoModel } from "./classes/PrenotazioneCampo";
import { PrenotazionePartitaModel } from "./classes/PrenotazionePartita";

mongoose.connect(process.env.MONGO_URL!).then(async e => {

    logger.debug("Connessione a mongodb avvenuta con successo")

    await PrenotazioneCampoModel.deleteMany({})
    await UtenteModel.deleteMany({})
    await PartitaModel.deleteMany({})
    await PrenotazionePartitaModel.deleteMany({})


    logger.info("DB pulito")

    let giovanni = new Giocatore(
        "Giovanni",
        "NNo",
        "giovanni@giova.ni",
        "giova.ni",
        "123abc",
        "345555555",
        new Date(2022, 2, 2),
        Genere.Maschio,
        100
    );

    giovanni.confermato = true;

    const giovanni_doc = await GiocatoreModel.create(giovanni)
    console.log("creato giovanni")

    let giovanna = new Giocatore(
        "Giovanna",
        "nannaaanana",
        "giovanna@giova.na",
        "giova.na",
        "123456",
        "3466666666",
        new Date(2022, 2, 3),
        Genere.Femmina,
        5000,
    );

    giovanna.confermato = true;

    const giovanna_doc = await GiocatoreModel.create(giovanna)
    console.log("creata giovanna")


    let circolone = new Circolo(
        "ilpadelsiamonoi",
        "ipsn@gmail.com",
        "circolo123",
        "044222301",
        "IT234234029340",
        56,
        false,
        99,
    )

    circolone.confermato = true;
    circolone.durataSlot = 60;

    const circolo_doc = await CircoloModel.create(circolone)
    console.log("creato il circolo")

    // Vado a modificare il circolo nel db

    const data_8 = new Date(1970, 0, 1, 8,0,0);
    const data_9 = new Date(1970, 0, 1, 9,0,0);
    const data_10 = new Date(1970, 0, 1, 10,0,0);
    const data_20 = new Date(1920, 0, 1, 20, 0, 0);

    // Ogni giorno apre ad un orario leggermente diverso
    await circolo_doc.setOrarioAperturaGiorno(GiornoSettimana.Lunedi, data_8)
    await circolo_doc.setOrarioAperturaGiorno(GiornoSettimana.Martedi, data_8)
    await circolo_doc.setOrarioAperturaGiorno(GiornoSettimana.Mercoledi, data_9)
    await circolo_doc.setOrarioAperturaGiorno(GiornoSettimana.Giovedi, data_9)
    await circolo_doc.setOrarioAperturaGiorno(GiornoSettimana.Venerdi, data_10)
    await circolo_doc.setOrarioAperturaGiorno(GiornoSettimana.Sabato, data_10)

    // Ma chiude sempre alle 20
    await circolo_doc.setOrarioChiusuraGiorno(GiornoSettimana.Lunedi, data_20)
    await circolo_doc.setOrarioChiusuraGiorno(GiornoSettimana.Martedi, data_20)
    await circolo_doc.setOrarioChiusuraGiorno(GiornoSettimana.Mercoledi, data_20)
    await circolo_doc.setOrarioChiusuraGiorno(GiornoSettimana.Giovedi, data_20)
    await circolo_doc.setOrarioChiusuraGiorno(GiornoSettimana.Venerdi, data_20)
    await circolo_doc.setOrarioChiusuraGiorno(GiornoSettimana.Sabato, data_20)


    console.log("creato campo " + await circolo_doc.addCampo(TipoCampo.Esterno))
    console.log("creato campo " + await circolo_doc.addCampo(TipoCampo.Esterno))
    console.log("creato campo " + await circolo_doc.addCampo(TipoCampo.Esterno))
    console.log("creato campo " + await circolo_doc.addCampo(TipoCampo.Interno))
    console.log("creato campo " + await circolo_doc.addCampo(TipoCampo.Interno))
    console.log("creato campo " + await circolo_doc.addCampo(TipoCampo.Interno))

    let prenotazioneCampoCircolo = new PrenotazioneCampoModel();
    await prenotazioneCampoCircolo.prenotazioneCircolo(
        new Date(2022, 4, 12, 10, 0),
        new Date(2022, 4, 12, 11, 0),
        1,
        circolo_doc,
    )


    // Creo due prenotazioni con partite nel giorno di oggi

    const data_slot = new Date(2023, 5, 13, 10, 0, 0);

    const partita_1_doc = await PartitaModel.create({
        isChiusa: false,
        categoria_max: 4,
        categoria_min: 2,
        giocatori: [ giovanna_doc, giovanni_doc ],
        circolo: circolo_doc,
        orario: data_slot
    })

    logger.debug("Creata partita di prova a " + data_slot.toJSON())

    await PrenotazionePartitaModel.create({
        pagato: true,
        costo: 56,
        partita: partita_1_doc,
        dataPrenotazione: new Date(),
        giocatore: giovanni_doc
    })

    logger.debug("Creata prenotazione partita per giovanna")

    await PrenotazionePartitaModel.create({
        pagato: true,
        costo: 56,
        partita: partita_1_doc,
        dataPrenotazione: new Date(),
        giocatore: giovanna_doc
    })

    logger.debug("Creata prenotazione partita per giovanna")

})
