import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, test, afterEach, afterAll } from '@jest/globals';
import { app } from '../../../src/routes/routes';
import jwt from "jsonwebtoken"
import { PartitaModel, Partita } from '../../../src/classes/Partita';
import { jest } from '@jest/globals';
import { response } from 'express';
import { ResolveTypegooseNameError } from '@typegoose/typegoose/lib/internal/errors';
import { Giocatore, GiocatoreModel } from '../../../src/classes/Giocatore';
import { Circolo, CircoloModel, TipoCampo } from '../../../src/classes/Circolo';
import { exitOnError } from 'winston';
import * as interfaces from '../../../src/routes/partite/partita.interface';
import { Ref } from '@typegoose/typegoose';
import { TipoAccount } from '../../../src/classes/Utente';
import { PrenotazioneCampo, PrenotazioneCampoModel } from '../../../src/classes/PrenotazioneCampo';
import { PrenotazioneGiocatore, PrenotazioneModel } from '../../../src/classes/PrenotazionePartita';

describe('GET /api/v1/partite/:idPartita', () => {

    beforeAll(() => {

        PartitaModel.findById = jest.fn().mockImplementation((params) => {
            if (params != "64679d72d7391e02188e77e0")
                return {
                    populate: (jest.fn() as jest.Mock).mockImplementation(() => {
                        return {
                            populate: (jest.fn() as jest.Mock).mockResolvedValue(null as never)
                        }
                    })
                }
            return {
                populate: (jest.fn() as jest.Mock).mockImplementation(() => {
                    return {
                        populate: (jest.fn() as jest.Mock).mockResolvedValue({
                            id_partita: "64679d72d7391e02188e77e0",
                            isChiusa: false,
                            categoria_max: 5,
                            categoria_min: 1,
                            giocatori: ["64679d72d7391e02188e77e1"],
                            circolo: "64679d72d7391e02188e77e4",
                            orario: new Date("1899-12-31T23:00:00.000Z")
                        } as never)
                    }
                })
            }
        }) as any

        const mock = jest.spyOn(interfaces, "p_to_ret",)
        mock.mockResolvedValue(true as never);
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
            if ((<any>params).email != "test@circolo.com")
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


describe("POST /api/v1/partite/ ", () => {
    afterAll(async () => {
        GiocatoreModel.exists = jest.fn() as any;
    })

    var tokenGiocatore = jwt.sign(
        {
            tipoAccount: "Giocatore",
            email: "giovanna@giova.na",
            nome: "Giovanna"
        },
        process.env.SUPER_SECRET!,
        {
            expiresIn: process.env.DEFAULT_EXPIRATION_PERIOD || "2d"
        }
    )

    GiocatoreModel.exists = jest.fn().mockImplementation((criterias) => {
        return {
            exec: jest.fn().mockImplementation(() => {
                if ((<any>criterias).id == "647c7288983d98fa300f5c11")
                    return "647c7288983d98fa300f5c11";
                return null
            })
        }
    }) as any;
    GiocatoreModel.findOne = jest.fn().mockImplementation(() => Promise.resolve(giocatore)) as any

    const giocatore: Giocatore =
        {
            "_id": "647c7288983d98fa300f5c11",
            "nome": "Giovanna",
            "email": "giovanna@giova.na",
            "telefono": "3466666666",
            "password": "$argon2id$v=19$m=65536,t=3,p=4$Do+0A2grTvA2OYL7Tt+6Jg$faap4kmkxPwGkHA80WU9Z5CeWVSMzZpOlnrQGplAUUU",
            "confermato": true,
            "utenteType": "Giocatore",
            "cognome": "nannaaanana",
            "nickname": "giova.na",
            "dataDiNascita": {
                "$date": "2022-03-02T23:00:00.000Z"
            },
            "genere": "femmina",
            "livello": 3000,
            "circoliAssociati": [],
            "preferiti": [],
            "__v": 0
        } as unknown as Giocatore
    const partita: Partita = {
        "isChiusa": true,
        "categoria_max": 4,
        "categoria_min": 1,
        "giocatori": [
            "647c7288983d98fa300f5c01" as unknown as Ref<Giocatore>
        ],
        "circolo": "647f9c1fe7061ea81d1fb7a5" as unknown as Ref<Circolo>,
        "tipocampo": "Esterno" as unknown as TipoCampo,
        "orario": new Date("2023-09-18T09:00:00.000Z"),
        getPrezzo: function () { },
        getCircolo: function () { }
    } as unknown as Partita
    const circolo: Circolo = {
        "_id": {
            "$oid": "647f9c1fe7061ea81d1fb7a5"
        },
        "nome": "Test",
        "email": "matteo.gastaldellomiotto@gmail.com",
        "telefono": "3292877972",
        "password": "$argon2id$v=19$m=65536,t=3,p=4$JmOqEFybQCIZNDfXVyiywA$wxEh/qoWmkZ0FNPqHRQif6RskkpreL123nQ1Ol0KJ2A",
        "confermato": true,
        "utenteType": "Circolo",
        "validato": false,
        "scontoAffiliazione": 0,
        "campi": [
            {
                "id": 1,
                "tipologia": "Interno"
            },
            {
                "id": 3,
                "tipologia": "Interno"
            },
            {
                "id": 4,
                "tipologia": "Interno"
            },
            {
                "id": 2,
                "tipologia": "Esterno"
            },
            {
                "id": 5,
                "tipologia": "Esterno"
            },
            {
                "id": 6,
                "tipologia": "Esterno"
            }
        ],
        "orarioSettimanale": [
            {
                "giorno": 0,
                "isAperto": true,
                "orarioApertura": {
                    "$date": {
                        "$numberLong": "-2208956400000"
                    }
                },
                "orarioChiusura": {
                    "$date": {
                        "$numberLong": "-2208906000000"
                    }
                }
            },
            {
                "giorno": 1,
                "isAperto": true,
                "orarioApertura": {
                    "$date": {
                        "$numberLong": "-2208956400000"
                    }
                },
                "orarioChiusura": {
                    "$date": {
                        "$numberLong": "-2208906000000"
                    }
                }
            },
            {
                "giorno": 2,
                "isAperto": true,
                "orarioApertura": {
                    "$date": {
                        "$numberLong": "-2208956400000"
                    }
                },
                "orarioChiusura": {
                    "$date": {
                        "$numberLong": "-2208906000000"
                    }
                }
            },
            {
                "giorno": 3,
                "isAperto": true,
                "orarioApertura": {
                    "$date": {
                        "$numberLong": "-2208956400000"
                    }
                },
                "orarioChiusura": {
                    "$date": {
                        "$numberLong": "-2208906000000"
                    }
                }
            },
            {
                "giorno": 4,
                "isAperto": true,
                "orarioApertura": {
                    "$date": {
                        "$numberLong": "-2208956400000"
                    }
                },
                "orarioChiusura": {
                    "$date": {
                        "$numberLong": "-2208906000000"
                    }
                }
            },
            {
                "giorno": 5,
                "isAperto": true,
                "orarioApertura": {
                    "$date": {
                        "$numberLong": "-2208956400000"
                    }
                },
                "orarioChiusura": {
                    "$date": {
                        "$numberLong": "-2208906000000"
                    }
                }
            },
            {
                "giorno": 6,
                "isAperto": true,
                "orarioApertura": {
                    "$date": {
                        "$numberLong": "-2208956400000"
                    }
                },
                "orarioChiusura": {
                    "$date": {
                        "$numberLong": "-2208906000000"
                    }
                }
            }
        ],
        "serviziAggiuntivi": [],
        "__v": 0,
        "paymentId": "acct_1NG6pvFk2nvmmn2V",
        "durataSlot": 90,
        "indirizzo": " ",
        "partitaIVA": " ",
        "prezzoSlotOrario": 20,
        "quotaAffiliazione": 20,
        check_coerenza_dataInputSlot: function () { },
        isOpen: function () { },
    } as unknown as Circolo
    const prenotazioneCampo: PrenotazioneCampo = {
        "_id": {
            "$oid": "6485de52c38c79e79909ad4f"
        },
        "idCampo": 1,
        "circolo": {
            "$oid": "647f9c1fe7061ea81d1fb7a5"
        },
        "dataPrenotazione": {
            "$date": "2023-06-11T14:45:10.473Z"
        },
        "partita": {
            "$oid": "6485dc695cf8148f87394ada"
        },
        "inizioSlot": {
            "$date": "2023-09-18T09:00:00.000Z"
        },
        "fineSlot": {
            "$date": "2023-09-18T10:30:00.000Z"
        },
        "__v": 0
    } as unknown as PrenotazioneCampo
    const prenotazioni = [prenotazioneCampo]
    const prenotazioneGiocatori: PrenotazioneGiocatore = {
        "_id": {
            "$oid": "648588701441ebcbd9803865"
        },
        "pagato": false,
        "costo": 20,
        "partita": {
            "$oid": "648588701441ebcbd9803861"
        },
        "giocatore": {
            "$oid": "647c7288983d98fa300f5c11"
        },
        "dataPrenotazione": {
            "$date": "2023-09-18T08:00:00.000Z"
        },
        "createdAt": {
            "$date": "2023-06-11T08:40:16.909Z"
        },
        "updatedAt": {
            "$date": "2023-06-11T08:40:16.909Z"
        },
        "__v": 0
    } as unknown as PrenotazioneGiocatore
    test('POST /api/v1/partite/ con id circolo non valido', async () => {
        const resp = await request(app).post('/api/v1/partite/').set('x-access-token', tokenGiocatore).send({
            categoria_max: 5,
            categoria_min: 1,
            giocatori: ["64679d72d7391e02188e77e1"],
            circolo: "10",
            orario: "1899-12-31T23:00:00.000Z"
        })
        expect(resp.status).toBe(400)
        expect(resp.body).toHaveProperty("success", false)
        expect(resp.body).toHaveProperty("message", "Id circolo formalmente errato")
    })
    test('POST /api/v1/partite/ con id circolo valido', async () => {
        PartitaModel.create = jest.fn().mockImplementation(() => Promise.resolve(partita)) as any;
        CircoloModel.findById = jest.fn().mockImplementation(() => Promise.resolve(circolo)) as any;
        PrenotazioneCampoModel.find = jest.fn().mockImplementation(() => Promise.resolve(prenotazioni)) as any;
        circolo.check_coerenza_dataInputSlot = jest.fn().mockImplementation(() => Promise.resolve(true)) as any;
        circolo.isOpen = jest.fn().mockImplementation(() => Promise.resolve(true)) as any;
        partita.getPrezzo = jest.fn().mockImplementation(() => Promise.resolve(20)) as any
        partita.getCircolo = jest.fn().mockImplementation(() => Promise.resolve(circolo)) as any
        PrenotazioneModel.create = jest.fn().mockImplementation(() => Promise.resolve(prenotazioneGiocatori)) as any

        const resp = await request(app).post('/api/v1/partite/').set('x-access-token', tokenGiocatore).send(partita)
        expect(resp.status).toBe(200)
        expect(resp.body).toHaveProperty("success", true)
    })
    // test('POST /api/v1/partite/ con id circolo valido e categoria non valida', async () => {
    //     GiocatoreModel.exists = jest.fn().mockImplementation((criterias) => {
    //         return {
    //             exec: jest.fn().mockImplementation(() => {
    //                 if ((<any>criterias).id == "64679d72d7391e02188e77e1")
    //                     return "64679d72d7391e02188e77e1";
    //                 return null
    //             })
    //         }
    //     }) as any;
    //     PartitaModel.create = jest.fn().mockImplementation(() => Promise.resolve('return value')) as any;
    //     const resp = await request(app).post('/api/v1/partite/').set('x-access-token', tokenGiocatore).send({
    //         categoria_max: 6,
    //         categoria_min: 1,
    //         giocatori: ["64679d72d7391e02188e77e1"],
    //         circolo: "64679d72d7391e02188e77e4",
    //         orario: "1899-12-31T23:00:00.000Z"
    //     })
    //     expect(resp.status).toBe(400)
    //     expect(resp.body).toHaveProperty("success", false)
    //     expect(resp.body).toHaveProperty("message", "Categoria invalida")
    // })
    // test('POST /api/v1/partite/ con id circolo valido e giocatori con id non valido', async () => {
    //     PartitaModel.create = jest.fn().mockImplementation(() => Promise.resolve('return value')) as any;
    //     const resp = await request(app).post('/api/v1/partite/').set('x-access-token', tokenGiocatore).send({
    //         categoria_max: 5,
    //         categoria_min: 1,
    //         giocatori: ["10"],
    //         circolo: "64679d72d7391e02188e77e4",
    //         orario: "1899-12-31T23:00:00.000Z"
    //     })
    //     expect(resp.status).toBe(400)
    //     expect(resp.body).toHaveProperty("success", false)
    //     expect(resp.body).toHaveProperty("message", "Trovati giocatori non validi tra quelli forniti")
    // })
    // test('POST /api/v1/partite/ con id circolo valido e giocatori con id non esistente nel database', async () => {
    //     PartitaModel.create = jest.fn().mockImplementation(() => Promise.resolve('return value')) as any;
    //     const resp = await request(app).post('/api/v1/partite/').set('x-access-token', tokenGiocatore).send({
    //         categoria_max: 5,
    //         categoria_min: 1,
    //         giocatori: ["64679d72d7391e02188e77e0"],
    //         circolo: "64679d72d7391e02188e77e4",
    //         orario: "1899-12-31T23:00:00.000Z"
    //     })
    //     expect(resp.status).toBe(400)
    //     expect(resp.body).toHaveProperty("success", false)
    //     expect(resp.body).toHaveProperty("message", "Trovati giocatori non esistenti tra quelli forniti")
    // })

});

// describe("DELETE /api/v1/partite/:idPartita", () => {
//     const validPartita = "64679d72d7391e02188e77e0";
//     var tokenCircolo = jwt.sign(
//         {
//             tipoAccount: "Circolo",
//             email: "test@circolo.com",
//             nome: "testCircolo"
//         },
//         process.env.SUPER_SECRET!,
//         {
//             expiresIn: process.env.DEFAULT_EXPIRATION_PERIOD || "2d"
//         }
//     )
//     beforeAll(() => {
//         PartitaModel.findByIdAndDelete = jest.fn().mockImplementation((params) => {
//             if (params != validPartita)
//                 return Promise.resolve(null)
//             return Promise.resolve("Partita")
//         }) as any;
//     });
//     afterAll(async () => {
//         PartitaModel.findById = jest.fn() as any;
//     })
//     test('DELETE /api/v1/partite/:idPartita esistente ', async () => {
//         const resp = await request(app).delete("/api/v1/partite/64679d72d7391e02188e77e0").set('x-access-token', tokenCircolo).send()
//         expect(resp.status).toBe(201);
//         expect(resp.body).toHaveProperty("success", true)
//     })
//     test('DELETE /api/v1/partite/:idPartita non esistente', async () => {
//         const resp = await request(app).delete("/api/v1/partite/64679d72d7391e02188e77e1").set('x-access-token', tokenCircolo).send()
//         expect(resp.status).toBe(404);
//         expect(resp.body).toHaveProperty("success", false)
//         expect(resp.body).toHaveProperty("message", "Nessuna partita trovata")
//     })
// });

// describe("UPDATE /api/v1/partite/:idPartita", () => {
//     const validPartita = "64679d72d7391e02188e77e0";
//     const validGiocatore = "64710dcfb43b091ad49f71be";
//     const retValue: any = {
//         id_partita: "64679d72d7391e02188e77e0",
//         isChiusa: false,
//         categoria_max: 5,
//         categoria_min: 1,
//         giocatori: ["64679d72d7391e02188e77e1"],
//         circolo: "64679d72d7391e02188e77e4",
//         orario: "1899-12-31T23:00:00.000Z",
//         checkChiusa: function () { },
//         checkLevel: function () { },
//         aggiungi_player: function () { },
//     }
//     var tokenGiocatore = jwt.sign(
//         {
//             tipoAccount: "Giocatore",
//             email: "test@giocatore.com",
//             nome: "testGiocatore"
//         },
//         process.env.SUPER_SECRET!,
//         {
//             expiresIn: process.env.DEFAULT_EXPIRATION_PERIOD || "2d"
//         }
//     )
//     beforeAll(() => {
//         PartitaModel.findById = jest.fn().mockImplementation((params) => {
//             if (params != validPartita)
//                 return Promise.resolve(null)
//             return Promise.resolve(retValue)
//         }) as any;
//         retValue.checkChiusa = jest.fn().mockImplementation((params) => {
//             return Promise.resolve(retValue.giocatori.length == 4);
//         })
//         retValue.checkLevel = jest.fn().mockImplementation((params) => {
//             if (params == validGiocatore)
//                 return true;
//             return false;
//         })
//         retValue.aggiungi_player = jest.fn().mockImplementation((params) => {
//             retValue.giocatori.push(params)
//             return Promise.resolve(retValue)
//         })
//     });
//     afterAll(async () => {
//         PartitaModel.findById = jest.fn() as any;
//     })
//     test('UPDATE /api/v1/partite/:idPartita esistente ', async () => {
//         const resp = await request(app).patch("/api/v1/partite/64679d72d7391e02188e77e0").set('x-access-token', tokenGiocatore).send({
//             giocatore: "64710dcfb43b091ad49f71be"
//         })
//         console.log(resp.body)
//         expect(resp.status).toBe(201);
//         expect(resp.body).toHaveProperty("success", true)
//     })
//     test('UPDATE /api/v1/partite/:idPartita giocatore liv. non valido', async () => {
//         const resp = await request(app).patch("/api/v1/partite/64679d72d7391e02188e77e0").set('x-access-token', tokenGiocatore).send({
//             giocatore: "64710dcfb43b091ad49f71b"
//         })
//         expect(resp.status).toBe(401);
//         expect(resp.body).toHaveProperty("success", false)
//         expect(resp.body).toHaveProperty("message", "Non puoi partecipare a questa partita : Livello invalido")
//     })
//     test('UPDATE /api/v1/partite/:idPartita non valido', async () => {
//         const resp = await request(app).patch("/api/v1/partite/10").set('x-access-token', tokenGiocatore).send({
//             giocatore: "64710dcfb43b091ad49f71be"
//         })
//         expect(resp.status).toBe(401);
//         expect(resp.body).toHaveProperty("success", false)
//         expect(resp.body).toHaveProperty("message", "ID partita invalido")
//     })
//     test('DELETE /api/v1/partite/:idPartita non esistente', async () => {
//         const resp = await request(app).patch("/api/v1/partite/64679d72d7391e02188e77e1").set('x-access-token', tokenGiocatore).send({
//             giocatore: "64710dcfb43b091ad49f71be"
//         })
//         expect(resp.status).toBe(404);
//         expect(resp.body).toHaveProperty("success", false)
//         expect(resp.body).toHaveProperty("message", "ID partita invalido")
//     })
// });