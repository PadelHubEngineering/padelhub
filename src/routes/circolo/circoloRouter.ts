import { Router, Request, Response } from "express";
import { PrenotazioneCampo, PrenotazioneCampoModel } from "../../classes/PrenotazioneCampo";
import { Circolo, CircoloModel } from "../../classes/Circolo";
import { TipoAccount } from "../../classes/Utente";
import { checkTokenCircolo } from "../../middleware/tokenChecker";

const router: Router = Router();


router.post('/prenotazioneSlot', async (req: Request, res: Response) => {
    //console.log(req.utenteAttuale)
    const { numeroSlot, idCampo } = req.body;

    const prenotazione = new PrenotazioneCampoModel();
    const mioCircolo = await CircoloModel.findOne({ email: req.utenteAttuale?.email })

    if(!mioCircolo){
        res.status(401)
        return
    }
    
    if(await PrenotazioneCampoModel.findOne({ email: mioCircolo.email, idCampo: idCampo, numeroSlot: numeroSlot }))
        res.sendStatus(500)

    await prenotazione.prenotazioneSlot(numeroSlot, idCampo, mioCircolo, TipoAccount.Circolo)
    
    res.status(200).json({
        operation: "Prenotazione Slot Circolo",
        status: "Successo"
    });
});

router.get('/prenotazioneSlot')


export default router;