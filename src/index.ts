import mongoose from "mongoose";
import { app } from "./routes/routes";
import { preliminary_check } from "./utils/general.utils";
import {Partita, PartitaModel} from "./classes/Partita"

import { logger } from "./utils/logging";

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

    // Inizializzazione Express
    app.listen(port, () => logger.debug(`App listening on port ${port}!`));
    console.log("ciao")
   


}

if (require.main === module && preliminary_check())
    main();

    
