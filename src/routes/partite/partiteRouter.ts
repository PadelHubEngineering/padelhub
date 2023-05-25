import {Router,Request,Response} from 'express'
import 'mongoose'
import '@typegoose/typegoose'

import { checkTokenCircolo , checkTokenGiocatoreOCircolo, checkTokenGiocatore} from '../../middleware/tokenChecker'

import {createPartita, readPartita , readAllPartite, deletePartita, updatePartita} from './crud_function_partite'


const router = Router();

//get all matches
router.get("/", checkTokenGiocatoreOCircolo,readAllPartite); 


//get a single match
router.get("/:PartitaId",checkTokenGiocatoreOCircolo,readPartita);

//add partita
router.post("/",checkTokenGiocatore ,createPartita);
    

//delete partita
router.delete("/:PartitaId", checkTokenCircolo,deletePartita);


//
router.patch("/:PartitaId",checkTokenGiocatore,updatePartita)







export default router