import { getModelForClass, pre, prop } from "@typegoose/typegoose"
import * as argon2 from "argon2";
import { logger } from "../utils/logging"

// Eseguito prima del salvataggio sul database dell'utente:
// sovrascrive la password attuale, se è stata modificata, con il suo hash.
// In questo modo alla creazione dell'utente possiamo usare una password
// come stringa, ma sarà salvata in modo sicuro
@pre<Utente>('save', async function (next) {

    if( !this.isModified() ) return next();

    let hash: string;

    try {
        hash = await argon2.hash(this.password);
    } catch (err: any) {
        logger.error(`Impossibile salvare password per utente ${this.email}`)
        return next(err)
    }

    this.password = hash;
    next()
})
export class Utente {
    @prop({ required: true })
    public nome: string

    @prop({ required: true, index: true })
    public email: string

    @prop({ required: true })
    public telefono: string

    @prop({ required:true })
    public password: string

    constructor( nome: string, email: string, telefono: string, password: string) {
        this.nome = nome;
        this.email = email;
        this.telefono = telefono;
        this.password = password;
    }

    async checkPassword(plain_password: string) {
        try {
            if (await argon2.verify(this.password, plain_password)) {
                logger.debug("Password verificata correttamente")
                return true
            } else {
                logger.debug(`Password errata utente: ${this.email}`)
                return false
            }
        } catch (err) {
            logger.warn(`Impossibile verificare password utente: ${this.email}`)
            return false;
        }

    }
}


// Non creiamo il model per la classe utente: non aggiungeremo mai gli utenti direttamente,
// ma solo circoli e giocatori
// export const UtenteModel = getModelForClass(Utente)
