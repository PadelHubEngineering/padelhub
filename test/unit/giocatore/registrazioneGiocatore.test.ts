import request from 'supertest';
import { describe, expect, test, jest, beforeAll} from '@jest/globals';
import { app } from '../../../src/routes/routes';
import jwt from "jsonwebtoken"
import { PrenotazioneCampo, PrenotazioneCampoModel } from '../../../src/classes/PrenotazioneCampo';
import { PrenotazioneGiocatore , PrenotazioneModel } from '../../../src/classes/PrenotazionePartita';
import { Campo, CircoloModel, TipoCampo } from '../../../src/classes/Circolo';
import { DateTime } from "luxon";
import { ERRORE_NON_AUTORIZZATO, ERRORE_TOKEN_NON_FORNITO, createTokenCircolo, createTokenGiocatore, dateToApi } from '../../utils/api.utils';
import { Giocatore, GiocatoreModel } from '../../../src/classes/Giocatore';
import { UtenteModel, TipoAccount, Utente } from '../../../src/classes/Utente';


describe("POST /api/v1/authentication", () => {

test("autenticazione giocatore con email errata", async () => {

    UtenteModel.findOne = jest.fn().mockImplementation((criterias) =>{
        return null
    }) as any

        await request(app)
            .post(`/api/v1/authentication`)
            .send({
                email : 3,
                password : "Ciao!123"
            })
            .expect('Content-Type', /json/)
            .expect(401)
            .then((res) => {
                if (res.body) {
                    expect(res.body).toHaveProperty("success", false)
                    expect(res.body).toHaveProperty("message", "Utente non trovato o password errata")
                }
            })
    })

    /*

test("autenticazione password sbagliata", async () => {
    UtenteModel.findOne = jest.fn().mockImplementation((criterias) =>{
        return {
            utente: "Giovanna",
            email: "giovanna@giova.na",
            TipoAccount : "Giocatore"
        }
    }) as any

    Utente.prototype.checkPassword = jest.fn().mockImplementation((criterias) =>{
        return 
            Promise.resolve(null)
    }) as any

        await request(app)
            .post(`/api/v1/authentication`)
            .send({
                email : "giovanna@giova.na",
                password : "passwordSBagliata"
            })
            .expect('Content-Type', /json/)
            .expect(401)
            .then((res) => {
                if (res.body) {
                    expect(res.body).toHaveProperty("success", false)
                    expect(res.body).toHaveProperty("message", "Utente non trovato o password errata")
                }
            })
    })*/
})


