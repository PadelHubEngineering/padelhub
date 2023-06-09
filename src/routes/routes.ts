import express, { Express, Request, Response, Router } from 'express';
import auth from './autenticazione/auth';
import circoloRouter from './circolo/circoloRouter';
import partiteRouter from './partite/partiteRouter'
import ricercaCircoli from './giocatore/ricercaCircoli';
import bodyParser from 'body-parser';
import { expressLogger } from '../utils/logging';
import prenotazioneGiocatoriRouter from './prenotazionePartite/prenotazionePartiteRoute'

import cors from "cors"
import { checkTokenCircolo, checkTokenGiocatoreOCircolo } from '../middleware/tokenChecker';
import { errorJsonHandler, notFoundErrorHandler } from "../middleware/errorHandler"
import giocatoreRouter from './giocatore/giocatoreRouter';

export const app: Express = express();

if( !process.env.TESTING )
  app.use(expressLogger);

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(errorJsonHandler)

app.use(cors())

// Route di default

const default_router = Router()

// respond with "hello world" when a GET request is made to the homepage
default_router.get('/', function(_req: Request, res: Response) {
  res.json({
    success: true,
    message: "hello world"
  });
});

default_router.use('/authentication', auth)
default_router.use('/circolo', circoloRouter)
default_router.use('/partite', partiteRouter)
default_router.use('/prenotazioneGiocatori',prenotazioneGiocatoriRouter)

default_router.use('/giocatore', giocatoreRouter)
default_router.use('/ricercaCircoli', ricercaCircoli)


app.use("/api/v1", default_router)

app.use(notFoundErrorHandler)
