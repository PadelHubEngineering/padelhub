import express, { Express, Request, Response, Router } from 'express';
import auth from './autenticazione/auth';
import bodyParser from 'body-parser';
import { expressLogger } from '../utils/logging';

import cors from "cors"

export const app: Express = express();

app.use(expressLogger);
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

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




app.use("/api/v1", default_router)
