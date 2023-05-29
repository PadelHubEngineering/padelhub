import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, test, afterEach, afterAll } from '@jest/globals';
import { app } from '../../../src/routes/routes';
import jwt from "jsonwebtoken"
import { PartitaModel } from '../../../src/classes/Partita';
import { jest } from '@jest/globals';
import { response } from 'express';
import { ResolveTypegooseNameError } from '@typegoose/typegoose/lib/internal/errors';
import { GiocatoreModel } from '../../../src/classes/Giocatore';
import { CircoloModel } from '../../../src/classes/Circolo';

describe('GET /api/v1/partite/:idPartita', () => {

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
                    orario: new Date("1899-12-31T23:00:00.000Z")
                } as never)
            }
        }) as any;
    });
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
        const resp = await request(app).get('/api/v1/partite/64679d72d7391e02188e77e0').set('x-access-token', token).send()
        expect(resp.status).toBe(200)
        expect(resp.body).toHaveProperty("success", true)
        expect(resp.body).toHaveProperty("payload", {
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
        const resp = await request(app).get('/api/v1/partite/64679d72d7391e02188e77e1').set('x-access-token', token).send()
        expect(resp.status).toBe(404)
        expect(resp.body).toHaveProperty("success", false)
        expect(resp.body).toHaveProperty("message", "Partita inesistente")
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

describe("GET /api/v1/partite/", () => {
    const retValue: any = [{
        id_partita: "64679d72d7391e02188e77e0",
        isChiusa: false,
        categoria_max: 5,
        categoria_min: 1,
        giocatori: ["64679d72d7391e02188e77e1"],
        circolo: "64679d72d7391e02188e77e4",
        orario: "1899-12-31T23:00:00.000Z"
    }, 
    {
        id_partita: "64679d72d7391e02188e77e2",
        isChiusa: false,
        categoria_max: 5,
        categoria_min: 1,
        giocatori: ["64679d72d7391e02188e77e1"],
        circolo: "64679d72d7391e02188e77e4",
        orario: "1899-12-31T23:00:00.000Z"
    }]

    beforeAll(() => {
        PartitaModel.find = jest.fn().mockImplementation((params) => {
            return {
                populate: (jest.fn() as jest.Mock).mockResolvedValueOnce(retValue as never)
            }
        }) as any;
        CircoloModel.findOne = jest.fn().mockImplementation((params) => {
            if((<any>params).email != "test@circolo.com")
                return null;
            return retValue;
        }) as any;
    });
    afterAll(async () => {
        PartitaModel.find = jest.fn() as any;
    })

    var tokenCircolo = jwt.sign(
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
    var tokenGiocatore = jwt.sign(
        {
            tipoAccount: "Giocatore",
            email: "test@giocatore.com",
            nome: "testGiocatore"
        },
        process.env.SUPER_SECRET!,
        {
            expiresIn: process.env.DEFAULT_EXPIRATION_PERIOD || "2d"
        }
    )

    test('GET /api/v1/partite/ con token Giocatore', async () => {
        const resp = await request(app).get('/api/v1/partite/').set('x-access-token', tokenGiocatore).send()
        expect(resp.status).toBe(200)
        expect(resp.body).toHaveProperty("success", true)
        expect(resp.body).toHaveProperty("payload", retValue)
    })
    test('GET /api/v1/partite/ con token Circolo con mail valida', async () => {
        const resp = await request(app).get('/api/v1/partite/').set('x-access-token', tokenCircolo).send()
        expect(resp.status).toBe(200)
        expect(resp.body).toHaveProperty("success", true)
        expect(resp.body).toHaveProperty("payload", retValue)
    })
    test('GET /api/v1/partite/ con token Circolo con mail non valida', async () => {
        var tokenCircoloNotValid = jwt.sign(
            {
                tipoAccount: "Circolo",
                email: "invalid@circolo.com",
                nome: "testCircolo"
            },
            process.env.SUPER_SECRET!,
            {
                expiresIn: process.env.DEFAULT_EXPIRATION_PERIOD || "2d"
            }
        )
        const resp = await request(app).get('/api/v1/partite/').set('x-access-token', tokenCircoloNotValid).send()
        expect(resp.status).toBe(500)
        expect(resp.body).toHaveProperty("success", false)
        expect(resp.body).toHaveProperty("message", "[server] Errore interno")
    })
});

