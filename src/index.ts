import mongoose from "mongoose";
import { logger } from "./config/logging";
import { app } from "./routes/routes";
import * as dotenv from "dotenv";

dotenv.config();


const port = process.env.PORT || 8080;

async function main() {
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

}

if (require.main === module)
    main();
