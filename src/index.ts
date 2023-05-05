import mongoose from "mongoose"
import config from "./config/general.config"
import { logger } from "./config/logging";
import * as dotenv from "dotenv";
dotenv.config();


async function main() {
    // Inizializzazione database
    try {
        console.log(process.env.MONGO_URL);
        await mongoose.connect(process.env.MONGO_URL!);
    } catch( e ) {
        logger.error("Connessione fallita a mongodb")
        return
    }

    logger.debug("Connessione a mongodb avvenuta con successo")

    // Inizializzazione Express

}

if (require.main === module)
    main();
