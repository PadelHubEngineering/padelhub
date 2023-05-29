import request from 'supertest';
import { describe, expect, test, jest } from '@jest/globals';
import { app } from '../../../src/routes/routes';
import jwt from "jsonwebtoken"
import { PrenotazioneCampoModel } from '../../../src/classes/PrenotazioneCampo';

describe("DELETE /api/v1/circolo/prenotazioneSlot", () => {
    const validDelete = "64710dcfb43b091ad49f71be"
    PrenotazioneCampoModel.findOne = jest.fn().mockImplementation((criterias) => {
        return {
            exec: jest.fn().mockImplementation(() => {
                if((<any>criterias)._id == validDelete)
                    return Promise.resolve()
                return null
            })
        } 
    }) as any;

    const token = jwt.sign(
        {
            tipoAccount: "Circolo",
            email: "test@circolo.com",
            nome: "testCircolo"
        },
        process.env.SUPER_SECRET!,
        {
            expiresIn: process.env.DEFAULT_EXPIRATION_PERIOD || "2d"
        }
    )

    test("Controllo con id non presente", async () => {

        await request(app).delete("/api/v1/circolo/prenotazioneSlot")
            .set('x-access-token', token)
            .expect('Content-Type', /json/)
            .expect(404)
            .then((res) => {
                if (res.body) {
                    expect(res.body).toHaveProperty("success", false)
                    expect(res.body).toHaveProperty("message", "Impossibile trovare il dato o la risorsa richiesta")
                }
            })
    })

    test("Controllo con id non valido", async () => {
        const resp = await request(app).delete("/api/v1/circolo/prenotazioneSlot/blabla").set('x-access-token', token).send()
        expect(resp.status).toBe(401)
        expect(resp.body).toHaveProperty("success", false)
        expect(resp.body).toHaveProperty("message", "Impossibile trovare la prenotazione richiesta")
    })
})
