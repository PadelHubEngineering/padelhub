import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, test, afterEach, afterAll } from '@jest/globals';
import { app } from '../../../src/routes/routes';
import jwt from "jsonwebtoken"
import { PartitaModel } from '../../../src/classes/Partita';
import { jest } from '@jest/globals';
import { response } from 'express';
import { ResolveTypegooseNameError } from '@typegoose/typegoose/lib/internal/errors';

describe('GET /api/v1/partite/:idPartita', () => {
    jest.useFakeTimers();

    beforeAll(() => {
        PartitaModel.findById = jest.fn().mockImplementation((params) => {
            if (params != "64679d72d7391e02188e77e0")
                return {
                    populate: (jest.fn() as jest.Mock).mockResolvedValueOnce(null as never)
                }

            return {
                populate: (jest.fn() as jest.Mock).mockResolvedValueOnce({
                    id_partita: "64679d72d7391e02188e77e0",
                    isChiusa: false,
                    categoria_max: 5,
                    categoria_min: 1,
                    giocatori: ["64679d72d7391e02188e77e1"],
                    circolo: "64679d72d7391e02188e77e4",
                    orario: new Date(0, 0)
                } as never)
            }
        }) as any;
        // PartitaModel.findById = jest.fn().mockReturnValueOnce({
        //     populate: (jest.fn() as jest.Mock).mockResolvedValueOnce({
        //         id_partita: "64679d72d7391e02188e77e0",
        //         isChiusa: false,
        //         categoria_max: 5,
        //         categoria_min: 1,
        //         giocatori: ["64679d72d7391e02188e77e1"],
        //         circolo: "64679d72d7391e02188e77e4",
        //         orario: new Date(0, 0)
        //     } as never)
        // }) as any;
    });

    // beforeEach(async () => {
    //     jest.useFakeTimers();
    // });

    // afterEach(async () => {
    //     jest.useRealTimers();
    // });
    afterAll(async () => {
        PartitaModel.findById = jest.fn() as any;
    })

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
        const response = await request(app).get('/api/v1/partite/64679d72d7391e02188e77e0').set('x-access-token', token).send()
        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty("success", true)
        expect(response.body).toHaveProperty("payload", {
            id_partita: "64679d72d7391e02188e77e0",
            isChiusa: false,
            categoria_max: 5,
            categoria_min: 1,
            giocatori: ["64679d72d7391e02188e77e1"],
            circolo: "64679d72d7391e02188e77e4",
            orario: "1899-12-31T23:00:00.000Z"
        } as never)
    });
    test('GET /api/v1/partite/:idPartita con id valido ma partita non presente', async () => {
        const response = await request(app).get('/api/v1/partite/64679d72d7391e02188e77e1').set('x-access-token', token).send()
        expect(response.status).toBe(404)
        expect(response.body).toHaveProperty("success", false)
        expect(response.body).toHaveProperty("message", "Partita inesistente")
    });
    test('GET /api/v1/partite/:idPartita con id non valido', async () => {
        request(app).get('/api/v1/partite/10')
            .set('x-access-token', token)
            .expect('Content-Type', /json/)
            .expect(401)
            .then((res) => {
                if (res.body) {
                    expect(res.body).toHaveProperty("success", false)
                    expect(res.body).toHaveProperty("message", "ID partita invalido")
                }
            });
    });
});

