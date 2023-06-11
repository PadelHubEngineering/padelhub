import request from 'supertest';
import { describe, expect, test, jest, beforeAll} from '@jest/globals';
import { app } from '../../../src/routes/routes';
import jwt from "jsonwebtoken"
import { PrenotazioneCampo, PrenotazioneCampoModel } from '../../../src/classes/PrenotazioneCampo';
import { Campo, CircoloModel, TipoCampo } from '../../../src/classes/Circolo';
import { DateTime } from "luxon";
import { ERRORE_NON_AUTORIZZATO, ERRORE_TOKEN_NON_FORNITO, createTokenCircolo, createTokenGiocatore, dateToApi } from '../../utils/api.utils';


//TODO: test visualizzazione partite: test per partite con categoria diversa da quella del giocatore, non le deve vedere
// test nel caso lui sia gia` in una partita dello stesso circolo allo stesso orario, deve far vedere solo quella
//

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

describe("POST /api/v1/circolo/registrazioneCircolo", ()=>{

    const email_circolo = "new@circolo.com"
    const nome_circolo = "NomeCircolo"
    const password_circolo = "Circolo!123"
    const telefono_circolo = "3318976554"


    test( "Registrazione circolo con nome mancante", async () => {

        await request(app)
            .post(`/api/v1/circolo/registrazioneCircolo`)
            .send({ 
                email: email_circolo, 
                telefono: telefono_circolo,
                password: password_circolo
             })
            .expect('Content-Type', /json/)
            .expect(400)
            .then((res) => {
                if (res.body) {
                    expect(res.body).toHaveProperty("success", false)
                    expect(res.body).toHaveProperty("message", "Nome invalido")
                }
            })
    })

    test( "Registrazione circolo con telefono errato", async () => {

        await request(app)
            .post(`/api/v1/circolo/registrazioneCircolo`)
            .send({ 
                nome: nome_circolo,
                email: email_circolo, 
                telefono: "3",
                password: password_circolo
             })
            .expect('Content-Type', /json/)
            .expect(400)
            .then((res) => {
                if (res.body) {
                    expect(res.body).toHaveProperty("success", false)
                    expect(res.body).toHaveProperty("message", "Telefono invalido")
                }
            })
    })

    test( "Registrazione circolo con email errata", async () => {

        await request(app)
            .post(`/api/v1/circolo/registrazioneCircolo`)
            .send({ 
                nome: nome_circolo,
                email: "email", 
                telefono: telefono_circolo,
                password: password_circolo
             })
            .expect('Content-Type', /json/)
            .expect(400)
            .then((res) => {
                if (res.body) {
                    expect(res.body).toHaveProperty("success", false)
                    expect(res.body).toHaveProperty("message", "Email non valida")
                }
            })
    })

})

describe("GET /api/v1/circolo/datiCircolo", () => {

    test( "Scarica dati circolo senza fornire il token", async () => {

        await request(app)
            .get(`/api/v1/circolo/datiCircolo`)
            .send()
            .expect('Content-Type', /json/)
            .expect(401)
            .then((res) => {
                if (res.body) {
                    expect(res.body).toHaveProperty("success", false)
                    expect(res.body).toHaveProperty("message", "Nessun token fornito")
                }
            })
    })

    test( "Scarica dati circolo con il token di un giocatore", async () => {

        const tokenInvalido = createTokenGiocatore()

        if ( !tokenInvalido )
            throw new Error('Il token, per qualche motivo erano null. non va bene');

        await request(app)
            .get(`/api/v1/circolo/datiCircolo`)
            .set('x-access-token', tokenInvalido)
            .send()
            .expect('Content-Type', /json/)
            .expect(403)
            .then((res) => {
                if (res.body) {
                    expect(res.body).toHaveProperty("success", false)
                    expect(res.body).toHaveProperty("message", "Non sei autorizzato ad accedere a questa risorsa")
                }
            })
    })

    test( "Scarica dati circolo correttamente", async () => {

        const token = createTokenCircolo()
        if ( !token )
            throw new Error('Il token, per qualche motivo erano null. non va bene');

        CircoloModel.findOne = jest.fn().mockImplementation((criterias) => {
            return {
                nome: "CircoloNuovo",
                email: "zanonmarco4@gmail.com",
                telefono: "3292877972",
                partitaIVA: "3292877972",
                indirizzo: "Via Trento",
                _id: "6485f2984fd64ccdff8a9819",
                utenteType: 'Circolo',
                validato: false,
                campi: [
                  { id: 1, tipologia: 'Interno' },
                  { id: 2, tipologia: 'Interno' },
                  { id: 3, tipologia: 'Esterno' },
                  { id: 4, tipologia: 'Esterno' },
                  { id: 5, tipologia: 'Esterno' }
                ],
                orarioSettimanale: [
                    {
                        giorno: 0,
                        isAperto: true,
                        orarioApertura: "1899-12-31T08:00:00.000Z",
                        orarioChiusura: "1899-12-31T23:00:00.000Z"
                    },
                    {
                        giorno: 1,
                        isAperto: true,
                        orarioApertura: "1899-12-31T09:00:00.000Z",
                        orarioChiusura: "1899-12-31T20:00:00.000Z"
                    },
                    {
                        giorno: 2,
                        isAperto: true,
                        orarioApertura: "1899-12-31T09:00:00.000Z",
                        orarioChiusura: "1899-12-31T20:00:00.000Z"
                    },
                    {
                        giorno: 3,
                        isAperto: false,
                        orarioApertura: "1899-12-31T00:00:00.000Z",
                        orarioChiusura: "1899-12-31T00:00:00.000Z"
                    },
                    {
                        giorno: 4,
                        isAperto: true,
                        orarioApertura: "1899-12-31T09:00:00.000Z",
                        orarioChiusura: "1899-12-31T23:00:00.000Z"
                    },
                    {
                        giorno: 5,
                        isAperto: false,
                        orarioApertura: "1899-12-31T00:00:00.000Z",
                        orarioChiusura: "1899-12-31T00:00:00.000Z"
                    },
                    {
                        giorno: 6,
                        isAperto: false,
                        orarioApertura: "1899-12-31T00:00:00.000Z",
                        orarioChiusura: "1899-12-31T00:00:00.000Z"
                    }
                ],
                durataSlot: 60,
                quotaAffiliazione: 20,
                prezzoSlotOrario: 14,
                scontoAffiliazione: 20,
                serviziAggiuntivi: [
                    "parcheggio",
                    "bar",
                    "piscina"
                ]
                
            }    
        }) as any;


        await request(app)
            .get(`/api/v1/circolo/datiCircolo`)
            .set('x-access-token', token)
            .send()
            .expect('Content-Type', /json/)
            .expect(200)
            .then((res) => {
                if (res.body) {
                    expect(res.body).toHaveProperty("success", true)
                    expect(res.body).toHaveProperty("payload",  {
                        anagrafica: {
                            nome: "CircoloNuovo",
                            email: "zanonmarco4@gmail.com",
                            telefono: "3292877972",
                            partitaIVA: "3292877972",
                            indirizzo: "Via Trento"
                        },
                        struttura: {
                            orariStruttura: [
                                {
                                    giorno: 0,
                                    isAperto: true,
                                    orarioApertura: "1899-12-31T08:00:00.000Z",
                                    orarioChiusura: "1899-12-31T23:00:00.000Z"
                                },
                                {
                                    giorno: 1,
                                    isAperto: true,
                                    orarioApertura: "1899-12-31T09:00:00.000Z",
                                    orarioChiusura: "1899-12-31T20:00:00.000Z"
                                },
                                {
                                    giorno: 2,
                                    isAperto: true,
                                    orarioApertura: "1899-12-31T09:00:00.000Z",
                                    orarioChiusura: "1899-12-31T20:00:00.000Z"
                                },
                                {
                                    giorno: 3,
                                    isAperto: false,
                                    orarioApertura: "1899-12-31T00:00:00.000Z",
                                    orarioChiusura: "1899-12-31T00:00:00.000Z"
                                },
                                {
                                    giorno: 4,
                                    isAperto: true,
                                    orarioApertura: "1899-12-31T09:00:00.000Z",
                                    orarioChiusura: "1899-12-31T23:00:00.000Z"
                                },
                                {
                                    giorno: 5,
                                    isAperto: false,
                                    orarioApertura: "1899-12-31T00:00:00.000Z",
                                    orarioChiusura: "1899-12-31T00:00:00.000Z"
                                },
                                {
                                    giorno: 6,
                                    isAperto: false,
                                    orarioApertura: "1899-12-31T00:00:00.000Z",
                                    orarioChiusura: "1899-12-31T00:00:00.000Z"
                                }
                            ],
                            durataSlot: 60,
                            quotaAffiliazione: 20,
                            prezzoSlotOrario: 14,
                            scontoAffiliazione: 20,
                            nCampiInterni: 2,
                            nCampiEsterni: 3
                        },
                        servizio: {
                            serviziAggiuntivi: [
                                "parcheggio",
                                "bar",
                                "piscina"
                            ]
                        }
                    })
                }
            })
    })

})

describe("POST /circolo/inserimentoDatiCircolo", () => {

    test( "Inserisci dati circolo con il token di un giocatore", async () => {

        const tokenInvalido = createTokenGiocatore()

        if ( !tokenInvalido )
            throw new Error('Il token, per qualche motivo erano null. non va bene');

        await request(app)
            .post(`/api/v1/circolo/inserimentoDatiCircolo`)
            .set('x-access-token', tokenInvalido)
            .send()
            .expect('Content-Type', /json/)
            .expect(403)
            .then((res) => {
                if (res.body) {
                    expect(res.body).toHaveProperty("success", false)
                    expect(res.body).toHaveProperty("message", "Non sei autorizzato ad accedere a questa risorsa")
                }
            })
    })

    test( "Inserisci dati circolo con dati mancanti", async () => {

        await request(app)
            .post(`/api/v1/circolo/inserimentoDatiCircolo`)
            .send({
                anagrafica: {
                    nome: "PadelLoro",
                    telefono: "32",
                    partitaIVA: "3292877972",
                    indirizzo: "Via Trento"
                }
            })
            .expect('Content-Type', /json/)
            .expect(401)
            .then((res) => {
                if (res.body) {
                    expect(res.body).toHaveProperty("success", false)
                    expect(res.body).toHaveProperty("message", "Nessun token fornito")
                }
            })
    })

    test( "Inserisci dati circolo con dati mancanti", async () => {

        const token = createTokenCircolo()

        CircoloModel.create = jest.fn().mockImplementation((criterias) => {
            return {
                
                    _id:  "6485f2984fd64ccdff8a9819",
                    nome: "Tastiko",
                    email: "zanonmarco4@gmail.com",
                    telefono: "3701303155",
                    password: "$argon2id$v=19$m=65536,t=3,p=4$bHnTvdlqcR5bt7jbtIvvmA$MEgZxd0i8SUiCUGzNduxse9y1+VvWH3JN419rfM1avQ",
                    confermato: true,
                    utenteType: "Circolo",
                    validato: false,
                    scontoAffiliazione: 50,
                    campi: [
                      { id: 1, tipologia: "Interno" },
                      { id: 2, tipologia: "Interno" },
                      { id: 3, tipologia: "Esterno" },
                      { id: 4, tipologia: "Esterno" },
                      { id: 5, tipologia: "Esterno" },
                    ],
                    orarioSettimanale: [
                        {
                            giorno: 0,
                            isAperto: true,
                            orarioApertura: "1899-12-31T08:00:00.000Z",
                            orarioChiusura: "1899-12-31T23:00:00.000Z"
                        },
                        {
                            giorno: 1,
                            isAperto: true,
                            orarioApertura: "1899-12-31T09:00:00.000Z",
                            orarioChiusura: "1899-12-31T20:00:00.000Z"
                        },
                        {
                            giorno: 2,
                            isAperto: true,
                            orarioApertura: "1899-12-31T09:00:00.000Z",
                            orarioChiusura: "1899-12-31T20:00:00.000Z"
                        },
                        {
                            giorno: 3,
                            isAperto: false,
                            orarioApertura: "1899-12-31T00:00:00.000Z",
                            orarioChiusura: "1899-12-31T00:00:00.000Z"
                        },
                        {
                            giorno: 4,
                            isAperto: true,
                            orarioApertura: "1899-12-31T09:00:00.000Z",
                            orarioChiusura: "1899-12-31T23:00:00.000Z"
                        },
                        {
                            giorno: 5,
                            isAperto: false,
                            orarioApertura: "1899-12-31T00:00:00.000Z",
                            orarioChiusura: "1899-12-31T00:00:00.000Z"
                        },
                        {
                            giorno: 6,
                            isAperto: false,
                            orarioApertura: "1899-12-31T00:00:00.000Z",
                            orarioChiusura: "1899-12-31T00:00:00.000Z"
                        }
                    ],
                    serviziAggiuntivi: [],
                    __v: 0,
                    paymentId: "acct_1NHqtCFwZqP386K0",
                    durataSlot: 60,
                    indirizzo: "via venezia 1, trento (TN), 38122 ",
                    partitaIVA: " ",
                    prezzoSlotOrario: 80,
                    quotaAffiliazione: 200
                  }
           
        }) as any;

        if ( !token )
            throw new Error('Il token, per qualche motivo erano null. non va bene');

        await request(app)
            .post(`/api/v1/circolo/inserimentoDatiCircolo`)
            .set('x-access-token', token)
            .send({
                anagrafica: {
                    nome: "PadelLoro",
                    telefono: "32",
                    partitaIVA: "3292877972",
                    indirizzo: "Via Trento"
                }
            })
            .expect('Content-Type', /json/)
            .expect(403)
            .then((res) => {
                if (res.body) {
                    expect(res.body).toHaveProperty("success", false)
                    expect(res.body).toHaveProperty("message", "Impossibile aggiornare circolo: dati mancanti")
                }
            })
    })

    test( "Inserisci dati circolo con campi float invece che int", async () => {

        const token = createTokenCircolo()

        if ( !token )
            throw new Error('Il token, per qualche motivo erano null. non va bene');

        CircoloModel.create = jest.fn().mockImplementation((criterias) => {
            return {
                _id:  "6485f2984fd64ccdff8a9819",
                nome: "Tastiko",
                email: "zanonmarco4@gmail.com",
                telefono: "3701303155",
                confermato: true,
                utenteType: "Circolo",
                validato: false,
                scontoAffiliazione: 50,
                campi: [
                    {
                      id: 1,
                      tipologia: "Interno"
                    },
                    {
                      id: 2,
                      tipologia: "Interno"
                    },
                    {
                      id: 3,
                      tipologia: "Esterno"
                    },
                    {
                      id: 4,
                      tipologia: "Esterno"
                    },
                    {
                      id: 5,
                      tipologia: "Esterno"
                    }
                  ],
                  orarioSettimanale: [
                    {
                        giorno: 0,
                        isAperto: true,
                        orarioApertura: "1899-12-31T08:00:00.000Z",
                        orarioChiusura: "1899-12-31T23:00:00.000Z"
                    },
                    {
                        giorno: 1,
                        isAperto: true,
                        orarioApertura: "1899-12-31T09:00:00.000Z",
                        orarioChiusura: "1899-12-31T20:00:00.000Z"
                    },
                    {
                        giorno: 2,
                        isAperto: true,
                        orarioApertura: "1899-12-31T09:00:00.000Z",
                        orarioChiusura: "1899-12-31T20:00:00.000Z"
                    },
                    {
                        giorno: 3,
                        isAperto: false,
                        orarioApertura: "1899-12-31T00:00:00.000Z",
                        orarioChiusura: "1899-12-31T00:00:00.000Z"
                    },
                    {
                        giorno: 4,
                        isAperto: true,
                        orarioApertura: "1899-12-31T09:00:00.000Z",
                        orarioChiusura: "1899-12-31T23:00:00.000Z"
                    },
                    {
                        giorno: 5,
                        isAperto: false,
                        orarioApertura: "1899-12-31T00:00:00.000Z",
                        orarioChiusura: "1899-12-31T00:00:00.000Z"
                    },
                    {
                        giorno: 6,
                        isAperto: false,
                        orarioApertura: "1899-12-31T00:00:00.000Z",
                        orarioChiusura: "1899-12-31T00:00:00.000Z"
                    }
                  ],
                  serviziAggiuntivi: [],
                  __v: 0,
                  paymentId: "acct_1NHqtCFwZqP386K0",
                  durataSlot: 60,
                  indirizzo: "via venezia 1, trento (TN), 38122 ",
                  partitaIVA: " ",
                  prezzoSlotOrario: 80,
                  quotaAffiliazione: 200
            }    
        }) as any;

        await request(app)
            .post(`/api/v1/circolo/inserimentoDatiCircolo`)
            .set('x-access-token', token) 
            .send({
                "anagrafica": {
                    "nome": "CircoloNuovo",
                    "telefono": "3292877972",
                    "partitaIVA": "3292877972",
                    "indirizzo": "Via Trento"
                },
                "struttura": {
                    "orariStruttura": [
                        {
                            "giorno": 0,
                            "isAperto": true,
                            "orarioApertura": "1899-12-31T08:00:00.000+00:00",
                            "orarioChiusura": "1899-12-31T23:00:00.000+00:00"
                        },
                        {
                            "giorno": 1,
                            "isAperto": true,
                            "orarioApertura": "1899-12-31T09:00:00.000+00:00",
                            "orarioChiusura": "1899-12-31T20:00:00.000+00:00"
                        },
                        {
                            "giorno": 2,
                            "isAperto": true,
                            "orarioApertura": "1899-12-31T09:00:00.000+00:00",
                            "orarioChiusura": "1899-12-31T20:00:00.000+00:00"
                        },
                        {
                            "giorno": 3,
                            "isAperto": false,
                            "orarioApertura": "1899-12-31T09:00:00.000+00:00",
                            "orarioChiusura": "1899-12-31T23:00:00.000+00:00"
                        },
                        {
                            "giorno": 4,
                            "isAperto": true,
                            "orarioApertura": "1899-12-31T09:00:00.000+00:00",
                            "orarioChiusura": "1899-12-31T23:00:00.000+00:00"
                        },
                        {
                            "giorno": 5,
                            "isAperto": false,
                            "orarioApertura": "1899-12-31T09:00:00.000+00:00",
                            "orarioChiusura": "1899-12-31T23:00:00.000+00:00"
                        },
                        {
                            "giorno": 6,
                            "isAperto": false,
                            "orarioApertura": "1899-12-31T09:00:00.000+00:00",
                            "orarioChiusura": "1899-12-31T23:00:00.000+00:00"
                        }
                    ],
                    "durataSlot": 60,
                    "quotaAffiliazione": 20,
                    "prezzoSlotOrario": 14,
                    "scontoAffiliazione": 20,
                    "nCampiInterni": 3.4,
                    "nCampiEsterni": 6.5
                },
                "servizio": {
                    "serviziAggiuntivi": [
                        "parcheggio",
                        "bar",
                        "piscina"
                    ]
                }
            })
            .expect('Content-Type', /json/)
            .expect(400)
            .then((res) => {
                if (res.body) {
                    expect(res.body).toHaveProperty("success", false)
                    expect(res.body).toHaveProperty("message", "Aggiornamento dati fallito invalido")
                }
            })
    })



})
