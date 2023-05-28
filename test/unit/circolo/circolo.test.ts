import request from 'supertest';
import { describe, expect, test } from '@jest/globals';
import { app } from '../../../src/routes/routes';
import jwt from "jsonwebtoken"

describe("DELETE /api/v1/circolo/prenotazioneSlot", () => {


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
        .then( ( res ) => {
            if(res.body){
                expect(res.body).toHaveProperty("success", false)
                expect(res.body).toHaveProperty("message", "Impossibile trovare il dato o la risorsa richiesta")
            }
        })
    })

    test("Controllo con id non valido", async () => {

       await request(app).delete("/api/v1/circolo/prenotazioneSlot/blabla")
        .set('x-access-token', token)
        .expect('Content-Type', /json/)
        .expect(401)
        .then( ( res ) => {
            if(res.body){
                expect(res.body).toHaveProperty("success", false)
                expect(res.body).toHaveProperty("message", "Impossibile trovare la prenotazione richiesta")
            }
        })
    })
})
