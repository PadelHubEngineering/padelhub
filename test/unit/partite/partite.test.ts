import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, test, afterEach } from '@jest/globals';
import { app } from '../../../src/routes/routes';
import jwt from "jsonwebtoken"
import { PartitaModel } from '../../../src/classes/Partita';
import { jest } from '@jest/globals';
import { response } from 'express';
import { ResolveTypegooseNameError } from '@typegoose/typegoose/lib/internal/errors';

describe('GET /api/v1/partite/:idPartita', () => {
    jest.useFakeTimers();

    beforeAll(() => {
        const model = {
            findById: jest.fn(() => ({
                populate: jest.fn(() => Promise.resolve([])),
            })),
        };
        jest.spyOn(PartitaModel, 'findById').mockImplementationOnce(() => ({
            populate: () => {
                id_partita: "64679d72d7391e02188e77e0",
                isChiusa: false,
                categoria_max: 5,
                categoria_min: 1,
                giocatori: ["64679d72d7391e02188e77e1"],
                circolo: "64679d72d7391e02188e77e4",
                orario: new Date(0, 0)
            }})
        )
        jest.spyOn(PartitaModel, "find").mockImplementationOnce(() => ({
            sort: () => ({
                limit: () => [{
                    id: '613712f7b7025984b080cea9',
                    text: 'Sample text'
                }] ,
            }),
        }));

        PartitaModel.populate = jest.fn().mockReturnValue({
            populate: (jest.fn() as jest.Mock).mockResolvedValueOnce({ name: "mock value" } as never)
        }) as any;
    });

    // beforeEach(async () => {
    //     jest.useFakeTimers();
    // });

    // afterEach(async () => {
    //     jest.useRealTimers();
    // });

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

    test('GET /api/v1/partite/:idPartita con id valido', async () => {
        jest.spyOn(PartitaModel, 'findById').mockResolvedValue(
            { id_partita: "64679d72d7391e02188e77e0", isChiusa: false, categoria_max: 5, categoria_min: 1, giocatori: ["64679d72d7391e02188e77e1"], circolo: "64679d72d7391e02188e77e4", orario: new Date(0, 0) })
        const response = await request(app).get('/api/v1/partite/64679d72d7391e02188e77e0').set('x-access-token', token).send()
        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty("success", true)
    }, 60000);

    // test('GET /api/v1/partite/:idPartita con id non valido', async () => {
    //     request(app).get('/api/v1/partite/10')
    //         .set('x-access-token', token)
    //         .expect('Content-Type', /json/)
    //         .expect(401)
    //         .then((res) => {
    //             if (res.body) {
    //                 expect(res.body).toHaveProperty("success", false)
    //                 expect(res.body).toHaveProperty("message", "ID partita invalido")
    //             }
    //         });
    // });
});