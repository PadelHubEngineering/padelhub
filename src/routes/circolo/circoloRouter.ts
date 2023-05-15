import { Router, Request, Response } from "express";
import { PrenotazioneCampo, PrenotazioneCampoModel } from "../../classes/PrenotazioneCampo";
import { Circolo, CircoloModel } from "../../classes/Circolo";
import { TipoAccount } from "../../classes/Utente";
import { checkTokenCircolo } from "../../middleware/tokenChecker";
import { logger } from "../../utils/logging";
import { Error } from "mongoose";
import { isNumericLiteral } from "typescript";

const router: Router = Router();


router.post('/prenotazioneSlot', async (req: Request, res: Response) => {
    const { numeroSlot, idCampo } = req.body;

    const prenotazione = new PrenotazioneCampoModel();
    const mioCircolo = await CircoloModel.findOne({ email: req.utenteAttuale?.email }).exec()

    if (!mioCircolo) {
        res.status(401)
        return
    }
    const searched = await PrenotazioneCampoModel.findOne({ circolo: mioCircolo._id, idCampo: idCampo, numeroSlot: numeroSlot, tipoUtente: TipoAccount.Circolo }).exec()
    if (searched) {
        res.status(500).json({
            operation: "Prenotazione Slot Circolo",
            status: "Fallita, prenotazione già inserita dal circolo per lo slot"
        });
        return
    }


    await prenotazione.prenotazioneSlot(numeroSlot, idCampo, mioCircolo, TipoAccount.Circolo)

    res.status(200).json({
        operation: "Prenotazione Slot Circolo",
        status: "Successo"
    });
});

router.get('/prenotazioniSlot', async (req: Request, res: Response) => {
    const mioCircolo = await CircoloModel.findOne({ email: req.utenteAttuale?.email })

    if (!mioCircolo) {
        res.status(401)
        return
    }

    const searched = await PrenotazioneCampoModel.find({ circolo: mioCircolo._id, tipoUtente: TipoAccount.Circolo }).exec()
    res.status(200).json(
        searched
    )
})


export default router;