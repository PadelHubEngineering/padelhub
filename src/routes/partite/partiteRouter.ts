import {Router,Request,Response} from 'express'
import 'mongoose'
import '@typegoose/typegoose'
import { Circolo, CircoloModel } from '../../classes/Circolo'
import { Giocatore,GiocatoreModel } from '../../classes/Giocatore'
import { Partita, PartitaModel } from '../../classes/Partita'
import { checkTokenCircolo } from "../../middleware/tokenChecker";
import { logger } from "../../utils/logging";
import {createPartita, readPartita , readAllPartite, deletePartita, updatePartita} from './crud_function_partite'


const router = Router();

//get all matches
router.get("/", readAllPartite); 


//get a single match
router.get("/:PartitaId",readPartita);

//add partita
router.post("/", createPartita);
    

//delete partita
router.delete("/:PartitaId", deletePartita);


//
router.patch("/:PartitaId",updatePartita)







export default router