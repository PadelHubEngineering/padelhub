import "mongoose";
import "@typegoose/typegoose"
import { CircoloModel,Circolo } from "../../classes/Circolo";
import { GiocatoreModel,Giocatore} from "../../classes/Giocatore";
import { Utente , UtenteModel, TipoAccount } from "../../classes/Utente";

import { PrenotazionePartita , PrenotazionePartitaModel } from "../../classes/PrenotazionePartita";
import {Router ,Request ,Response} from "express"


const router = Router();

//getting every reservations of an user //filter
router.get("/", async (req : Request, res :Response) =>{
    
})

//add a new reservation
router.post("/", async (req : Request, res :Response)=>{

})


//getting a single user reservation
router.get("/:id", async (req : Request, res :Response)=>{

})

//deleting a single reservation/cashback
router.delete("/:id", async (req : Request, res :Response)=>{

})



export default router;

