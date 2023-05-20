import { NextFunction , Request ,Response} from "express"
import { PartitaModel, Partita } from "../classes/Partita"
import 'mongoose'
import { isValidObjectId } from "mongoose"


//creazione di una partita
const createPartita = async (req: Request, res: Response, next : NextFunction) =>{
    const {giocatori, circolo , categoria_min , categoria_max} = req.body
    
    const partita = new PartitaModel({
        giocatori : giocatori,
        circolo : circolo,
        categoria_min : categoria_min,
        categoria_max : categoria_max

    })

    return await partita.save()
    .then((partita) => {res.status(201).json(partita)})
    .catch((error)=> {res.status(500).json(error)});
}

//lettura di tutte le partite
const readPartita = async (req : Request, res : Response, next : NextFunction) =>{

    const id = req.params.PartitaId
    if(!isValidObjectId(id)){
        return res.status(401).json({message: "ID partita invalido"})
    }

    return await PartitaModel.findById(id)
    .then(partita => partita ? res.status(200).json({partita}) : res.status(404).json({message: "Partita non trovata"}))
    .catch((err) => {res.status(500).json({err})})


}

//lettura di una singola partita
const readAllPartite = async (req : Request, res : Response, next : NextFunction)=>{
    return await PartitaModel.find()
    .then(partite => res.status(200).json({partite}))
    .catch((error) => res.status(500).json({error})) 
}


//eliminazione della partita
const deletePartita = async (req :Request, res : Response, next : NextFunction) => {
    const id = req.params.PartitaId;
    console.log(id)
    if(!isValidObjectId(id)){
        return res.status(401).json({message: "ID partita invalido"})
    }

    return await PartitaModel.findByIdAndDelete(id)
    .then((partita) => partita ? res.status(201).json({partita}) : res.status(404).json({message: "Nessuna partita trovata"}) )
    .catch((error) => res.status(500).json({error})) 
    
    //.then((partita) => partita ? res.status(201).json({partita}) : res.json(404).json({message: "Partita non trovata"}))
    //.catch((error) => res.status(500).json({error}))

}


//aggiunta di un altro giocatore alla partita
const updatePartita = async (req : Request , res : Response, next : NextFunction) => {
    const id = req.params.PartitaId;
    console.log(id)
    const giocatore = req.body.giocatore
    console.log(giocatore)
    if(!isValidObjectId(id)){
        return res.status(401).json({message: "ID partita invalido"})
    }

    //check level
    return await PartitaModel.findById(id)
    .then(async (partita) => {
        if(partita){
            if(partita?.isChiusa ){
                console.log("Piena")
                res.status(200).json({message: "Partita piena"})
            }else{
                console.log("C'è posto")
                

                const p=await PartitaModel.findById(id)
                p?.giocatori.push(giocatore)
                if(p?.giocatori.length==4){
                    p.isChiusa = true
                }
                await p?.save()
                //create prenotazione res.post. prenotazione
                res.status(201).json({p})
            }
        }else{
            res.status(404).json({message: "ID partita invalido"})
            

    } })
    .catch((error) => res.status(500).json({error}))
    

}

export {createPartita,readPartita, readAllPartite, deletePartita,updatePartita}