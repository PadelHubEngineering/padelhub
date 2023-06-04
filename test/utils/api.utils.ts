import jwt from "jsonwebtoken"

export function dateToApi(data: Date) {
    return `${data.getFullYear().toString()}-${(data.getMonth() + 1).toString().padStart(2, "0")}-${data.getDate().toString().padStart(2, "0")}`
}

export function createTokenCircolo(email_circolo?: string) {
    return jwt.sign(
        {
            tipoAccount: "Circolo",
            email: email_circolo || "test@circolo.com",
            nome: "testCircolo"
        },
        process.env.SUPER_SECRET!,
        {
            expiresIn: process.env.DEFAULT_EXPIRATION_PERIOD || "2d"
        }
    )
}

export function createTokenGiocatore(email_giocatore?: string) {
    return jwt.sign(
        {
            tipoAccount: "Giocatore",
            email: email_giocatore || "test@giocatore.com",
            nome: "testGiocatore"
        },
        process.env.SUPER_SECRET!,
        {
            expiresIn: process.env.DEFAULT_EXPIRATION_PERIOD || "2d"
        }
    )
}

export const ERRORE_TOKEN_NON_FORNITO = "Nessun token fornito"
export const ERRORE_NON_AUTORIZZATO = "Non sei autorizzato ad accedere a questa risorsa"
