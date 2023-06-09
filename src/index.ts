import mongoose from "mongoose";
import { app } from "./routes/routes";
import { preliminary_check } from "./utils/general.utils";
import { Partita, PartitaModel } from "./classes/Partita"
//import { populate } from "./utils/populate";
import { logger } from "./utils/logging";
import { Giocatore, GiocatoreModel } from "./classes/Giocatore";
import { TipoAccount, UtenteModel } from "./classes/Utente";
import { deleteBefore, populate } from "./utils/populate";
import { createConnectedAccount, deleteAllAccounts, getOnboardingLink, handlePaymentSlot, populateProducts } from "./utils/gestionePagamenti.utils"
import { inviaEmailOnboarding } from "./utils/email.utils";
//import { createUnparsedSourceFile, servicesVersion, textSpanIntersectsWith } from "typescript";
//import { Circolo, CircoloModel, GiornoSettimana, OrarioGiornaliero } from "./classes/Circolo";


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


    console.log(await handlePaymentSlot("acct_1NG6pvFk2nvmmn2V", 60, 20))
    // console.log(await createProduct("Slot 60 minuti"));
    // console.log(await createProduct("Slot 90 minuti"));
    // console.log(await createProduct("Slot 120 minuti"));

    app.listen(port, () => logger.info(`App listening on port ${port}!`));


}

if (require.main === module && preliminary_check())

    main();



