import { Router, Request, Response } from 'express'
import 'mongoose'
import '@typegoose/typegoose'

import { checkTokenCircolo, checkTokenGiocatoreOCircolo, checkTokenGiocatore } from '../../middleware/tokenChecker'

import { createPartita, readPartita, readAllPartite, deletePartita, updatePartita } from './crud_function_partite'
import { handlePaymentPrenotazione } from '../../utils/gestionePagamenti.utils'
import { sendHTTPResponse } from '../../utils/general.utils'


const router = Router();

//get all matches
router.get("/", checkTokenGiocatoreOCircolo, readAllPartite);

//add partita
router.post("/",checkTokenGiocatore ,createPartita);

//get a single match
router.get("/:PartitaId", checkTokenGiocatoreOCircolo, readPartita);

//delete partita
router.delete("/:PartitaId", checkTokenCircolo, deletePartita);

//
router.patch("/:PartitaId", checkTokenGiocatore, updatePartita)



export default router
