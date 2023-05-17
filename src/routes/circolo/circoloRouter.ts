import { Router, Request, Response } from "express";
import { PrenotazioneCampo, PrenotazioneCampoModel } from "../../classes/PrenotazioneCampo";
import { Circolo, CircoloModel, Campo, TipoCampo } from "../../classes/Circolo";
import { TipoAccount } from "../../classes/Utente";
import { checkTokenCircolo } from "../../middleware/tokenChecker";
import { logger } from "../../utils/logging";
import { Error } from "mongoose";
import { isNumericLiteral } from "typescript";
import { error } from "winston";

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
    var dateReq = req.headers["dataAttuale"] as string

    if (!dateReq) {
        res.status(401).json({
            success: false,
            message: "Date not passed to request"
        });
        return
    }
    if (!mioCircolo) {
        res.status(401)
        return
    }

    var giorno: Date = new Date();

    try {
        giorno = new Date(dateReq)

    }
    catch (err) {
        logger.error(err)
    }

    const prenotazioniSlot = await PrenotazioneCampoModel.find({
        circolo: mioCircolo._id,
        inizioSlot: {
            $gte: new Date(giorno.getFullYear(), giorno.getMonth(), giorno.getDay()),
            $lt: new Date(giorno.getFullYear(), giorno.getMonth(), giorno.getDay() + 1)
        }
    }).exec()
    console.log(prenotazioniSlot);

    var retObj = {
        orarioApertura: mioCircolo.orarioSettimanale[giorno.getDay()].orarioApertura,
        orarioChiusura: mioCircolo.orarioSettimanale[giorno.getDay()].orarioChiusura,
        durataSlot: mioCircolo.durataSlot,
        campiInterni: [] as any[],
        campiEsterni: [] as any[]
    }

    prenotazioniSlot.forEach((prenotazioneCampo) => {
        var campoPrenotato: Campo | undefined = mioCircolo.campi.find((campo) => campo.id == prenotazioneCampo.idCampo)
        if (!campoPrenotato) {
            logger.error("Campo non esistente");
            return;
        }

        if (campoPrenotato.tipologia == TipoCampo.Esterno) {
            var tmp = retObj.campiInterni.find((campo) => campo.idCampo == prenotazioneCampo.idCampo)
        }
        else if (campoPrenotato.tipologia == TipoCampo.Interno) {

        }
        else {
            logger.error("Tipo campo non definito");
            return
        }
    })



    res.status(200).json(
        retObj
    )
})


export default router;