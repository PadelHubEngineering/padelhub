import { DocumentType } from "@typegoose/typegoose"
import { Giocatore } from "../../classes/Giocatore"
import { Circolo } from "../../classes/Circolo"
import { Partita } from "../../classes/Partita"

export type PartiteAperteI = {
    giaPrenotato: boolean,
    partite: PartitaRetI[],
    circolo: CircoloRetI,
    isAffiliato: boolean
}

export type PartitaRetI = {
    _id: string,
    orario: Date,
    giocatori: GiocatoreRetI[],
    categoria_max: number,
    categoria_min: number,
    tipoCampo: string,
    circolo?: CircoloRetI
}

export type CircoloRetI = {
    _id: string,
    nome: string,
    durataSlot: number,
    costoPrenotazione: number
}

export type GiocatoreRetI = {
    nome: string,
    cognome: string,
    nickname: string,
    foto: string
}

export function g_to_ret(giocatore: DocumentType<Giocatore>) {
    return {
        nome: giocatore.nome,
        cognome: giocatore.cognome,
        nickname: giocatore.nickname,
        foto: giocatore.foto,
    } as GiocatoreRetI
}

export function c_to_ret(circolo: DocumentType<Circolo>) {
    return {
        _id: circolo._id.toString(),
        nome: circolo.nome,
        durataSlot: circolo.durataSlot,
        costoPrenotazione: circolo.prezzoSlotOrario
    } as CircoloRetI
}

export function p_to_ret(partita: DocumentType<Partita>, giocatori: DocumentType<Giocatore>[], circolo?: DocumentType<Circolo> ) {
    return {
        ...partita.toObject(),
        giocatori: giocatori.map( g_to_ret ),

        // Se il circolo c'è, lo filtro prima di inviarlo
        circolo: circolo ? c_to_ret(circolo) : undefined,

        createdAt: undefined,
        updatedAt: undefined,
        isChiusa: undefined,
        __v: undefined,
    } as PartitaRetI
}

export async function map_to_display(partite: DocumentType<Partita>[]) {

    let ret: PartitaRetI[] = [];

    for( const partita of partite ) {

        const partita_g = await partita.populate("giocatori")

        // Con il populate, giocatori da Ref<Giocatore>[] diventa DocumentType<Giocatore>[]
        // @ts-ignore-error
        const giocatori_partita: DocumentType<Giocatore>[] = partita_g.giocatori;

        ret.push(p_to_ret( partita, giocatori_partita ))
    }

    return ret
}