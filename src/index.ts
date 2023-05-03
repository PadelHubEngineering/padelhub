import mongoose from "mongoose"
import config from "./config/general.config"
import { logger } from "./config/logging";

async function main() {
    // Inizializzazione database
    try {
        await mongoose.connect(config.mongodb_connection_string);
    } catch( e ) {
        logger.error("Connessione fallita a mongodb")
        return
    }

    logger.debug("Connessione a mongodb avvenuta con successo")

    // Inizializzazione Express


}

if (require.main === module)
    main();
