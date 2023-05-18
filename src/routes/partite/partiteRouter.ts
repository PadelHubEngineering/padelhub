import {Router,Request,Response} from 'express'
import 'mongoose'
import '@typegoose/typegoose'
import { Circolo, CircoloModel } from '../../classes/Circolo'
import { Giocatore,GiocatoreModel } from '../../classes/Giocatore'
import { Partita, PartitaModel } from '../../classes/Partita'
import { checkTokenCircolo } from "../../middleware/tokenChecker";
import { logger } from "../../utils/logging";


const router = Router();

//get all matches
router.get("/", async (req : Request, res : Response ) => {
    /*
    return all partite
    */
   try{
        const partite = await PartitaModel.find();
        res.status(200).json({partite})
        console.log(partite)
   }catch(err){
        res.status(500).json()

   }
})


//get a single match
router.get("/:id",async (req : Request , res : Response) =>{
    try{
        
        const partita= await PartitaModel.findById(req.params.id)
        res.status(200).json(partita)
        console.log(partita, req.params)



    }catch(err){
        res.status(500).json()
        console.log(err)
        

    }
})

//add partita
router.post("/",async (req : Request, res : Response)=>{
    try{

        var partita = await new PartitaModel(req.body).save()
        res.status(200).json(partita)
        

    }catch(err){
        res.status(404).json()
    }
})
//delete partita
router.delete("/:id", async (req: Request, res : Response) =>{
    try{
        const partita= await PartitaModel.findByIdAndDelete(req.params.id)
        res.status(200).json(partita)

        console.log(partita)
        
    }
    catch(err){
        res.status(500).json({status: 500, message : "Internal Error"})

    }
})






export default router