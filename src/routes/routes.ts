import express, { Express, Request, Response } from 'express';
import auth from './autenticazione/auth';
import bodyParser from 'body-parser';
import { expressLogger } from '../config/logging';

export const app: Express = express();

app.use(expressLogger);
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// respond with "hello world" when a GET request is made to the homepage
app.get('/', function(_req: Request, res: Response) {
  res.send('hello world');
});

app.use('/authentication', auth)
