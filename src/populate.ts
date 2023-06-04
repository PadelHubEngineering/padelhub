import mongoose from "mongoose";
import { logger } from "./utils/logging";
import { UtenteModel } from "./classes/Utente";
import { PartitaModel } from "./classes/Partita";
import { Genere, Giocatore, GiocatoreModel } from "./classes/Giocatore";
import { Circolo, CircoloModel, TipoCampo } from "./classes/Circolo";
import { PrenotazioneCampoModel } from "./classes/PrenotazioneCampo";

mongoose.connect(process.env.MONGO_URL!).then(async e => {

    logger.debug("Connessione a mongodb avvenuta con successo")

    await PrenotazioneCampoModel.deleteMany({})
    await UtenteModel.deleteMany({})

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

    GiocatoreModel.create(giovanni).then(e => {
        console.log("creato giovanni")
    })

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

    await GiocatoreModel.create(giovanna).then(e => {
        console.log("creata giovanna")
    })


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
    let circoltwo = new Circolo(
        "ilpadelsonoloro",
        "ipsl@gmail.com",
        "circolo123",
        "044222301",
        "IT234234029340",
        56,
        false,
        99,
    )

    //TODO: Manca durata slot
    //TODO: mancano degli orari di apertura decenti

    let circoloDoc = await CircoloModel.create(circolone)
    let circoloTwo = await CircoloModel.create(circoltwo)

    console.log("creato il circolone")
    console.log("creato il circoltwo")

    console.log("creato " + await circoloDoc.addCampo(TipoCampo.Esterno))
    console.log("creato " + await circoloDoc.addCampo(TipoCampo.Esterno))
    console.log("creato " + await circoloDoc.addCampo(TipoCampo.Esterno))
    console.log("creato " + await circoloDoc.addCampo(TipoCampo.Interno))
    console.log("creato " + await circoloDoc.addCampo(TipoCampo.Interno))
    console.log("creato " + await circoloDoc.addCampo(TipoCampo.Interno))

    let prenotazioneCampoCircolo = new PrenotazioneCampoModel();
    await prenotazioneCampoCircolo.prenotazioneCircolo(
        new Date(2022, 4, 12, 10, 0),
        new Date(2022, 4, 12, 11, 0),
        1,
        circoloDoc,
    )

}).catch(e => {
    logger.error("Enniente sei un deficente")
})
