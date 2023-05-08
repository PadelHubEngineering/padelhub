import { Circolo } from "../classes/Circolo";
import { Giocatore } from "../classes/Giocatore";
import { logger } from "./logging";


export function preliminary_check() {

    if ( process.env.SUPER_SECRET === undefined ) {
        logger.error("Impossibile caricare chiave privata, esco")
        return false
    }

    return true
}