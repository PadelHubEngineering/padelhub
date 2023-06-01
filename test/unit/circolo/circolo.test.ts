import request from 'supertest';
import { describe, expect, test, jest, beforeAll} from '@jest/globals';
import { app } from '../../../src/routes/routes';
import jwt from "jsonwebtoken"
import { PrenotazioneCampo, PrenotazioneCampoModel } from '../../../src/classes/PrenotazioneCampo';
import { Campo, CircoloModel, TipoCampo } from '../../../src/classes/Circolo';
import { DateTime } from "luxon";
import { ERRORE_NON_AUTORIZZATO, ERRORE_TOKEN_NON_FORNITO, createTokenCircolo, createTokenGiocatore, dateToApi } from '../../utils/api.utils';


describe("DELETE /api/v1/circolo/prenotazioneSlot", () => {


    const token = createTokenCircolo()

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

    test("Delete valido", async () => {
        const validDelete = "64710dcfb43b091ad49f71be"

        PrenotazioneCampoModel.findOne = jest.fn().mockImplementation((criterias) => {
            return {
                exec: jest.fn().mockImplementation(() => {
                    if((<any>criterias)._id == validDelete)
                        return Promise.resolve(true)
                    return Promise.resolve(null)
                })
            }
        }) as any;

        PrenotazioneCampoModel.deleteOne = jest.fn().mockImplementation((criterias) => {
            return{
                exec: jest.fn().mockImplementation(() => {
                    if ((<any>criterias)._id == validDelete)
                        return Promise.resolve({
                            deletedCount: 1
                        });
                    return Promise.resolve({
                        deletedCount: 0
                    })
                })
            }
        }) as any;

        await request(app).delete(`/api/v1/circolo/prenotazioneSlot/${validDelete}`)
            .set('x-access-token', token)
            .expect('Content-Type', /json/)
            .expect(201)
            .then((res) => {
                if (res.body) {
                    expect(res.body).toHaveProperty("success", true)
                    expect(res.body).toHaveProperty("message", "Prenotazione eliminata con successo")
                }
            })
    })

})

describe("GET /api/v1/circolo/prenotazioneSlot/{data}", () => {

    const circoloId = "6473381c54353c2f33ece86d"
    const email_circolo = "test@circolo.com"
    const data_to_check = new Date(2022, 10, 3, 1, 0)
    const durataSlot = 55

    const inizioSlot = new Date(data_to_check)

    let fineSlot: Date | null = null

    const orarioApertura = new Date(data_to_check)

    let orarioChiusura: Date | null = null

    let token: string | null = null

    beforeAll(() => {


        inizioSlot.setMinutes(55)
        inizioSlot.setHours(8)

        fineSlot = DateTime.fromJSDate(inizioSlot).plus({ minutes: durataSlot }).toJSDate()

        orarioApertura.setHours(8)
        orarioApertura.setMinutes(0)

        orarioChiusura = DateTime.fromJSDate(orarioApertura).plus({ minutes: durataSlot * 6 }).toJSDate()
        orarioApertura.setHours(8)
        orarioApertura.setMinutes(0)

        token = createTokenCircolo(email_circolo)

        PrenotazioneCampoModel.find = jest.fn().mockImplementation((criterias: any) => {
            return {
                exec: jest.fn().mockImplementation(() => {
                    if(
                        criterias.circolo == circoloId &&
                        criterias.inizioSlot.$gte.toJSON() == data_to_check.toJSON() &&
                        criterias.inizioSlot.$lt.toJSON() == DateTime.fromJSDate(data_to_check).plus({ day: 1 }).toJSDate().toJSON()
                    )
                        return Promise.resolve([
                            {
                                idCampo: 2,
                                circolo: {
                                    _id: circoloId
                                },
                                dataPrenotazione: data_to_check,
                                inizioSlot,
                                fineSlot,
                            } as PrenotazioneCampo,
                            {
                                idCampo: 1,
                                circolo: {
                                    _id: circoloId
                                },
                                dataPrenotazione: data_to_check,
                                inizioSlot,
                                fineSlot,
                            } as PrenotazioneCampo
                        ])
                    return Promise.resolve([])
                })
            }
        }) as any;

        // Per trovare l'id del circolo
        CircoloModel.findOne = jest.fn().mockImplementation((criterias) => {
            return {
                exec: jest.fn().mockImplementation(() => {
                    if((<any>criterias).email == email_circolo) {

                        let orario_settimanale: any[] = []

                        for(let i=0;i<=7;i++)
                            orario_settimanale.push({ orarioApertura, orarioChiusura })

                        return Promise.resolve({
                            _id: circoloId,
                            durataSlot,
                            campi: [
                                { id: 1, tipologia: TipoCampo.Interno} as Campo,
                                { id: 2, tipologia: TipoCampo.Esterno} as Campo,
                            ],
                            orarioSettimanale: orario_settimanale
                        })
                    }
                    return Promise.resolve(null)
                })
            }
        }) as any;
    })

    test("Richiesta prenotazione valida", async ()=> {

        if ( !token || !fineSlot || !orarioChiusura )
            throw new Error('Il token o qualche altra data, per qualche motivo erano null. non va bene');

        await request(app)
            .get(`/api/v1/circolo/prenotazioniSlot/${dateToApi( data_to_check )}`)
            .set('x-access-token', token)
            .expect('Content-Type', /json/)
            .expect(200)
            .then((res) => {
                if (res.body && fineSlot && orarioChiusura) {
                    expect(res.body).toHaveProperty("success", true)
                    expect(res.body).toHaveProperty("payload")

                    expect(res.body.payload).toHaveProperty("orarioApertura", orarioApertura.toJSON())
                    expect(res.body.payload).toHaveProperty("orarioChiusura", orarioChiusura.toJSON())
                    expect(res.body.payload).toHaveProperty("durataSlot", durataSlot)

                    expect(res.body.payload).toHaveProperty("campiInterni")
                    expect(res.body.payload.campiInterni).toHaveLength(1)

                    expect(res.body.payload.campiInterni[0]).toHaveProperty("prenotazioni")
                    expect(res.body.payload.campiInterni[0].prenotazioni).toHaveLength(1)
                    expect(res.body.payload.campiInterni[0].prenotazioni[0]).toHaveProperty("inizioSlot", inizioSlot.toJSON())
                    expect(res.body.payload.campiInterni[0].prenotazioni[0]).toHaveProperty("fineSlot", fineSlot.toJSON())

                    expect(res.body.payload).toHaveProperty("campiEsterni")
                    expect(res.body.payload.campiEsterni).toHaveLength(1)

                    expect(res.body.payload.campiEsterni[0]).toHaveProperty("prenotazioni")
                    expect(res.body.payload.campiEsterni[0].prenotazioni).toHaveLength(1)
                    expect(res.body.payload.campiEsterni[0].prenotazioni[0]).toHaveProperty("inizioSlot", inizioSlot.toJSON())
                    expect(res.body.payload.campiEsterni[0].prenotazioni[0]).toHaveProperty("fineSlot", fineSlot.toJSON())
                } else {
                    throw new Error("Impossibile continuare il test, manca res.body (O fineslot, o orarioChiusura)")
                }
            })
    })

    test("Data in formato non formalmente corretto", async () => {

        if ( !token || !fineSlot || !orarioChiusura )
            throw new Error('Il token o qualche altra data, per qualche motivo erano null. non va bene');

        await request(app)
            .get(`/api/v1/circolo/prenotazioniSlot/2022-2-16`)
            .set('x-access-token', token)
            .expect('Content-Type', /json/)
            .expect(404)
            .then((res) => {
                if (res.body && fineSlot && orarioChiusura) {
                    expect(res.body).toHaveProperty("success", false)
                    expect(res.body).toHaveProperty("message", "Impossibile trovare il dato o la risorsa richiesta")
                }
            })
    })


    test("Richiesta prenotazioni Slot Circolo senza passaggio data come parametro", async () => {

        if ( !token || !fineSlot || !orarioChiusura )
            throw new Error('Il token o qualche altra data, per qualche motivo erano null. non va bene');

        await request(app)
            .get(`/api/v1/circolo/prenotazioniSlot/`)
            .set('x-access-token', token)
            .expect('Content-Type', /json/)
            .expect(404)
            .then((res) => {
                if (res.body && fineSlot && orarioChiusura) {
                    expect(res.body).toHaveProperty("success", false)
                    expect(res.body).toHaveProperty("message", "Impossibile trovare il dato o la risorsa richiesta")
                }
            })
    })

    test("Data non valida", async () => {

        if ( !token )
            throw new Error('Il token o qualche altra data, per qualche motivo erano null. non va bene');

        await request(app)
            .get(`/api/v1/circolo/prenotazioniSlot/2022-02-30`)
            .set('x-access-token', token)
            .expect('Content-Type', /json/)
            .expect(400)
            .then((res) => {
                if (res.body) {
                    expect(res.body).toHaveProperty("success", false)
                    expect(res.body).toHaveProperty("message", "Una data inserita invalida")
                }
            })
    })

    test("Richiesta prenotazioni con data in formato valido ma senza passaggio token", async () => {

        await request(app)
            .get(`/api/v1/circolo/prenotazioniSlot/2022-02-16`)
            .expect('Content-Type', /json/)
            .expect(401)
            .then((res) => {
                if (res.body) {
                    expect(res.body).toHaveProperty("success", false)
                    expect(res.body).toHaveProperty("message", ERRORE_TOKEN_NON_FORNITO)
                }
            })
    })


    test("Richiesta prenotazioni con data in formato valido con token non autorizzato ad accedere alle risorse", async () => {

        const tokenInvalido = createTokenGiocatore()

        await request(app)
            .get(`/api/v1/circolo/prenotazioniSlot/2022-02-16`)
            .set('x-access-token', tokenInvalido)
            .expect('Content-Type', /json/)
            .expect(403)
            .then((res) => {
                if (res.body) {
                    expect(res.body).toHaveProperty("success", false)
                    expect(res.body).toHaveProperty("message", ERRORE_NON_AUTORIZZATO)
                }
            })
    }
)
})

describe("POST /api/v1/circolo/prenotazioneSlot", () => {

    const circoloId = "6473381c54353c2f33ece86d"
    const email_circolo = "test@circolo.com"
    const durataSlot = 60

    let token: string | null = null

    beforeAll( () => {

        token = createTokenCircolo(email_circolo)

        // Per trovare l'id del circolo
        CircoloModel.findOne = jest.fn().mockImplementation((criterias) => {
            return {
                exec: jest.fn().mockImplementation(() => {
                    if((<any>criterias).email == email_circolo) {

                        return Promise.resolve({
                            _id: circoloId,
                            campi: [
                                { id: 1, tipologia: TipoCampo.Interno} as Campo,
                                { id: 2, tipologia: TipoCampo.Esterno} as Campo,
                            ],
                            durataSlot
                        })
                    }
                    return Promise.resolve(null)
                })
            }
        }) as any;

        PrenotazioneCampoModel.prototype.prenotazioneCircolo = jest.fn().mockReturnValueOnce(Promise.resolve(true))
    } )


    test( "Prenotazione Slot Circolo, con data non inserita nel body o in formato non valido", async () => {

        if ( !token )
            throw new Error('Il token, per qualche motivo erano null. non va bene');

        await request(app)
            .post(`/api/v1/circolo/prenotazioneSlot`)
            .set('x-access-token', token)
            .send({  })
            .expect('Content-Type', /json/)
            .expect(400)
            .then((res) => {
                if (res.body) {
                    expect(res.body).toHaveProperty("success", false)
                    expect(res.body).toHaveProperty("message", "La data inserita non è corretta")
                }
            })
    } )



    test( "Prenotazione Slot Circolo, con data inserita nel body ma account non valido", async () => {

        const tokenInvalido = createTokenGiocatore()

        await request(app)
            .post(`/api/v1/circolo/prenotazioneSlot`)
            .set('x-access-token', tokenInvalido)
            .send({  })
            .expect('Content-Type', /json/)
            .expect(403)
            .then((res) => {
                if (res.body) {
                    expect(res.body).toHaveProperty("success", false)
                    expect(res.body).toHaveProperty("message", ERRORE_NON_AUTORIZZATO)
                }
            })
    } )


    test( "Prenotazione Slot Circolo, con data inserita nel body e account valido. Campo non esitente", async () => {

        if ( !token )
            throw new Error('Il token, per qualche motivo erano null. non va bene');

        await request(app)
            .post(`/api/v1/circolo/prenotazioneSlot`)
            .set('x-access-token', token)

            // Esistono solo due campi nella mockFunction
            .send({ dataOraPrenotazione: new Date().toJSON(), idCampo: 3 })

            .expect('Content-Type', /json/)
            .expect(400)
            .then((res) => {
                if (res.body) {
                    expect(res.body).toHaveProperty("success", false)
                    expect(res.body).toHaveProperty("message", "Campo non trovato")
                }
            })
    } )

    test( "Prenotazione Slot Circolo, con data inserita nel body e account valido. Prenotazione già esistente da parte del circolo per quello slot", async () => {

        PrenotazioneCampoModel.findOne = jest.fn().mockReturnValueOnce({ exec: async () => true }) as any;

        if ( !token )
            throw new Error('Il token, per qualche motivo erano null. non va bene');

        await request(app)
            .post(`/api/v1/circolo/prenotazioneSlot`)
            .set('x-access-token', token)
            .send({ dataOraPrenotazione: new Date().toJSON(), idCampo: 1 })
            .expect('Content-Type', /json/)
            .expect(500)
            .then((res) => {
                if (res.body) {
                    expect(res.body).toHaveProperty("success", false)
                    expect(res.body).toHaveProperty("message", "Prenotazione già inserita dal circolo per lo slot")
                }
            })
    } )


    test( "Creazione prenotazione slot circolo come utente anonimo", async () => {

        await request(app)
            .post(`/api/v1/circolo/prenotazioneSlot`)
            .send({ dataOraPrenotazione: new Date().toJSON(), idCampo: 1 })
            .expect('Content-Type', /json/)
            .expect(401)
            .then((res) => {
                if (res.body) {
                    expect(res.body).toHaveProperty("success", false)
                    expect(res.body).toHaveProperty("message", ERRORE_TOKEN_NON_FORNITO)
                }
            })
    } )
})
