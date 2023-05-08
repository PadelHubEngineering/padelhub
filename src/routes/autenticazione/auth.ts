import { Router, Request, Response } from 'express';
import { Utente, UtenteModel, TipoAccount } from '../../classes/Utente';
import jwt from "jsonwebtoken"
import { TokenAutenticazione } from '../../middleware/tokenChecker';

import { logger } from '../../utils/logging';
import { Giocatore, GiocatoreModel, Genere } from '../../classes/Giocatore';
import { CircoloModel } from '../../classes/Circolo';

const router: Router = Router();

async function cercaUtente(email: string): Promise<null | { utente: Utente, tipo_utente: TipoAccount }> {

    const searched = await UtenteModel.findOne({ email }).exec();

    if (searched) {
        return {
            utente: searched,
            tipo_utente: searched.utenteType as TipoAccount
        }
    }

    return null;
}

router.post('', async function (req: Request, res: Response) {
    const { email, password } = req.body;

    var searched = await cercaUtente(email);

    let token;

    //await GiocatoreModel.create(new Giocatore("a", "b", "1", "aa", new Date(), Genere.Maschio, 1, "aaa"));
    if (!searched) {
        res.status(401).json({
            success: false,
            message: "Utente non trovato o password errata"
        })
        return
    } else {
        // Controllo correttezza della password
        let { utente, tipo_utente } = searched;
        console.log(searched.tipo_utente)
        const esito_autenticazione = await utente.checkPassword(password);

        if (!esito_autenticazione) {
            logger.debug(`Autenticazione con password errata utente: ${utente.email}`)

            // Cattiva pratica far capire all'utente nello specifico quale
            // problema non ha permesso di concludere l'autenticazione
            res.status(401).json({
                success: false,
                messagge: "Utente non trovato o password errata"
            })
            return
        }

        // Autenticazione eseguita con successo

        token = jwt.sign(
            {
                tipoAccount: tipo_utente,
                email: utente.email,
                nome: utente.nome
            } as TokenAutenticazione,
            process.env.SUPER_SECRET!,
            {
                expiresIn: process.env.DEFAULT_EXPIRATION_PERIOD || "2d"
            }
        )

        // Invio i dati già destrutturati così che il frontend non debba
        // eseguire nulla
        res.json({
            success: true,
            message: 'Autenticazione completata con successo',
            token: token,
            dati: {
                tipoAccount: tipo_utente,
                email: utente.email,
                nome: utente.nome
            } as TokenAutenticazione,
        });
    }
});
export default router;
