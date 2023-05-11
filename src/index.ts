import mongoose from "mongoose";
import { app } from "./routes/routes";
import { preliminary_check } from "./utils/general.utils";
import {Partita, PartitaModel} from "./classes/Partita"
//import { populate } from "./utils/populate";
import { logger } from "./utils/logging";
import { Giocatore , GiocatoreModel} from "./classes/Giocatore";
import { TipoAccount, UtenteModel } from "./classes/Utente";
//import { createUnparsedSourceFile, servicesVersion, textSpanIntersectsWith } from "typescript";
//import { Circolo, CircoloModel, GiornoSettimana, OrarioGiornaliero } from "./classes/Circolo";


const port = process.env.PORT || 8080;

async function main() {
    logger.info("Application started")
    // Inizializzazione database
    try {
        await mongoose.connect(process.env.MONGO_URL!);
    } catch( e ) {
        logger.error("Connessione fallita a mongodb")
        return
    }
    logger.debug("Connessione a mongodb avvenuta con successo")

  
    

    
}

if (require.main === module && preliminary_check())
    
    main();
    

    
