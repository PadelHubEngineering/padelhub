import mongoose from "mongoose";
import { app } from "./routes/routes";
import { preliminary_check } from "./utils/general.utils";
import { Partita, PartitaModel } from "./classes/Partita"
//import { populate } from "./utils/populate";
import { logger } from "./utils/logging";
import { Giocatore, GiocatoreModel } from "./classes/Giocatore";
import { TipoAccount, UtenteModel } from "./classes/Utente";
import { deleteBefore, populate } from "./utils/populate";
//import { createUnparsedSourceFile, servicesVersion, textSpanIntersectsWith } from "typescript";
//import { Circolo, CircoloModel, GiornoSettimana, OrarioGiornaliero } from "./classes/Circolo";
import { PrenotazioneGiocatore, PrenotazioneModel } from "./classes/PrenotazionePartita";


const port = process.env.PORT || 8080;

async function main() {
    logger.info("Application started")
    // Inizializzazione database
    try {
        await mongoose.connect(process.env.MONGO_URL!);
    } catch (e) {
        logger.error("Connessione fallita a mongodb")
        return
    }
    logger.debug("Connessione a mongodb avvenuta con successo")
    //await deleteBefore()
    //await populate()
    // Inizializzazione Express
    

  


    app.listen(port, () => logger.debug(`App listening on port ${port}!`));
}

if (require.main === module && preliminary_check())

    main();



