import { Router, Request, Response } from "express";
import { PrenotazioneCampo, PrenotazioneCampoModel } from "../../classes/PrenotazioneCampo";
import { Circolo, CircoloModel, Campo, TipoCampo } from "../../classes/Circolo";
import { TipoAccount } from "../../classes/Utente";
import { checkTokenCircolo } from "../../middleware/tokenChecker";
import { logger } from "../../utils/logging";
import { Error } from "mongoose";
import { isNumericLiteral } from "typescript";
import { error } from "winston";
import { Partita } from "../../classes/Partita";

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

    var inizioSlot = new Date(2023,5,18, 8, 0)
    var fineSlot = new Date(2023,5,18, 9, 0)


    await prenotazione.prenotazioneCircolo(inizioSlot, fineSlot, 1, mioCircolo)

    res.status(200).json({
        operation: "Prenotazione Slot Circolo",
        status: "Successo"
    });
});

router.get('/prenotazioniSlot', async (req: Request, res: Response) => {
    const mioCircolo = await CircoloModel.findOne({ email: req.utenteAttuale?.email })
    var dateReq = req.headers["data-attuale"] as string

    //console.log(req.headers)
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

    const prenotazioniSlot: PrenotazioneCampo[] = await PrenotazioneCampoModel.find({
        circolo: mioCircolo._id,
        inizioSlot: {
            $gte: new Date(giorno.getFullYear(), giorno.getMonth(), giorno.getDay()),
            $lt: new Date(giorno.getFullYear(), giorno.getMonth(), giorno.getDay() + 1)
        }
    }).exec()

    var retObj = {
        orarioApertura: mioCircolo.orarioSettimanale[giorno.getDay()].orarioApertura,
        orarioChiusura: mioCircolo.orarioSettimanale[giorno.getDay()].orarioChiusura,
        durataSlot: mioCircolo.durataSlot,
        campiInterni: [] as any[], // { idCampo: number, prenotazioni: [{ nSlot: 2,color: Color.Red }] }
        campiEsterni: [] as any[]
    }

    var campiInterniMap = new Map<number,any[]>();

    console.log(prenotazioniSlot)
    prenotazioniSlot.forEach((prenotazioneCampo) => {
        var campoPrenotato: Campo | undefined = mioCircolo.campi.find((campo) => campo.id == prenotazioneCampo.idCampo)
        if (!campoPrenotato) {
            logger.error("Campo non esistente");
            return;
        }

        var prenotazione = {  
            inizioSlot: prenotazioneCampo.inizioSlot,
            fineSlot: prenotazioneCampo.fineSlot,
            tipoUtente: prenotazioneCampo.partita == undefined ? TipoAccount.Circolo : TipoAccount.Giocatore
        }
        if (campoPrenotato.tipologia == TipoCampo.Esterno) {
            console.log("campo esterno")
            var ind = retObj.campiEsterni.findIndex((campo) => campo.idCampo == prenotazioneCampo.idCampo)
            retObj.campiEsterni[ind].prenotazioni.push(prenotazione)
        }
        else if (campoPrenotato.tipologia == TipoCampo.Interno) {
            console.log("campo interno")
            retObj.campiInterni.find((campo) => campo.idCampo == prenotazioneCampo.idCampo).prenotazioni.push(prenotazione)
        }
        else {
            logger.error("Tipo campo non definito");
            return
        }
    })

    console.log(retObj)



    res.status(200).json(
        retObj
    )
})


export default router;