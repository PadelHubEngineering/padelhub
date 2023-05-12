import { Router, Request, Response } from "express";
import { PrenotazioneCampo, PrenotazioneCampoModel } from "../../classes/PrenotazioneCampo";
import { Circolo, CircoloModel } from "../../classes/Circolo";
import { TipoAccount } from "../../classes/Utente";

const router: Router = Router();


router.post('/prenotazioneSlot', async (req: Request, res: Response) => {
    const prenotazione = new PrenotazioneCampoModel();
    const mioCircolo = await CircoloModel.findOne({ email: req.utenteAttuale?.email })

    if(!mioCircolo){
        res.status(401)
        return
    }
    await prenotazione.prenotazioneSlot(1, 0, mioCircolo, TipoAccount.Circolo)
});



export default router;