import mongoose from "mongoose";
import config from "./config/general.config";
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
    app.listen(port, () => console.log(`App listening on port ${port}!`));
    logger.debug("Connessione a mongodb avvenuta con successo")

    // Inizializzazione Express

}

if (require.main === module)
    main();
