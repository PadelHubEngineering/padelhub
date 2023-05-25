import request from 'supertest';
import { describe, expect, test } from '@jest/globals';
import { app } from '../../../src/routes/routes';
import jwt from "jsonwebtoken" 


describe('GET /api/v1/partite/:idPartita', () => {
    var token = jwt.sign(
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

    test('GET /api/v1/partite/:idPartita', async () => {
        request(app).get('/api/v1/partite/10')
        .set('x-access-token', token)
        .expect('Content-Type', /json/)
        .expect(401)
        .then( (res) => {
            if(res.body){
                expect(res.body).toHaveProperty("success", false)
                expect(res.body).toHaveProperty("message", "ID partita invalido")
            }
    });
    });
});