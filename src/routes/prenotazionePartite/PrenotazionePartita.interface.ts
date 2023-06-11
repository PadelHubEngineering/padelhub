import { DocumentType } from "@typegoose/typegoose";
import { PrenotazioneGiocatore } from "../../classes/PrenotazionePartita";
import { Giocatore } from "../../classes/Giocatore";
import { GiocatoreRetI, PartitaRetI, g_to_ret, p_to_ret } from "../partite/partita.interface";
import { Partita } from "../../classes/Partita";

interface PrenotazionePartitaRetI {
    pagato: boolean;
    costo: number;

    partita?: PartitaRetI;
    giocatore?: GiocatoreRetI;

    dataPrenotazione: string
}

export async function prenotazione_partita_to_ret( prenotazione: DocumentType<PrenotazioneGiocatore>, default_giocatore: DocumentType<Giocatore>  ) {

    const p_con_partita = await prenotazione.populate("partita");

    //@ts-expect-error
    const partita: DocumentType<Partita> = p_con_partita.partita;

    let partita_to_ret = undefined;

    if( partita != null ){
        const p_gioc = await partita.populate("giocatori")

        //@ts-expect-error
        const giocatori: DocumentType<Giocatore>[] = p_gioc.giocatori;

        partita_to_ret = p_to_ret( partita, giocatori )
    }

    if( !default_giocatore ) {

        const p_con_giocatore = await prenotazione.populate("partita");

        //@ts-expect-error
        default_giocatore = p_con_giocatore.giocatore
    }

    return {
        ...prenotazione.toObject(),
        giocatore: g_to_ret( default_giocatore ),

        partita: partita_to_ret,

        createdAt: undefined,
        updatedAt: undefined,
        __v: undefined,
    } as PrenotazionePartitaRetI
}
