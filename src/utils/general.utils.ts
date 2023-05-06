import { Circolo } from "../classes/Circolo";
import { Giocatore } from "../classes/Giocatore";
import { logger } from "./logging";

export type Cliente = Giocatore | Circolo;

export function preliminary_check() {

    if ( process.env.SUPER_SECRET === undefined ) {
        logger.error("Impossibile caricare chiave privata, esco")
        return false
    }

    return true
}

export enum TipoAccount {
    Giocatore,
    Circolo,
    OperatoreCustomerService,
    Amministratore,
}

export enum Genere { Maschio, Femmina, Altro}
