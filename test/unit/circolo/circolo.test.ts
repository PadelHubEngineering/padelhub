import request from 'supertest';
import { describe, expect, test, jest } from '@jest/globals';
import { app } from '../../../src/routes/routes';
import jwt from "jsonwebtoken"
import { PrenotazioneCampo, PrenotazioneCampoModel } from '../../../src/classes/PrenotazioneCampo';
import { Campo, CircoloModel, TipoCampo } from '../../../src/classes/Circolo';
import { DateTime } from "luxon";

function createTokenCircolo(email_circolo?: string) {
    return jwt.sign(
        {
            tipoAccount: "Circolo",
            email: email_circolo || "test@circolo.com",
            nome: "testCircolo"
        },
        process.env.SUPER_SECRET!,
        {
            expiresIn: process.env.DEFAULT_EXPIRATION_PERIOD || "2d"
        }
    )
}

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
    inizioSlot.setMinutes(55)
    inizioSlot.setHours(8)

    const fineSlot = DateTime.fromJSDate(inizioSlot).plus({ minutes: durataSlot }).toJSDate()

    const orarioApertura = new Date(data_to_check)
    orarioApertura.setHours(8)
    orarioApertura.setMinutes(0)

    const orarioChiusura = DateTime.fromJSDate(orarioApertura).plus({ minutes: durataSlot * 6 }).toJSDate()
    orarioApertura.setHours(8)
    orarioApertura.setMinutes(0)

    const token = createTokenCircolo(email_circolo)

    test("Richiesta prenotazione valida", async ()=> {
        const validSearch = "64710dcfb43b091ad49f71be"

        PrenotazioneCampoModel.find = jest.fn().mockImplementation((criterias: any) => {
            return {
                exec: jest.fn().mockImplementation(() => {
                    console.log("criterias")
                    console.log(criterias)
                    console.log(data_to_check)
                    console.log(DateTime.fromJSDate(data_to_check).plus({ day: 1 }).toJSDate())
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


        await request(app)
            .get(`/api/v1/circolo/prenotazioniSlot/${data_to_check.getFullYear().toString()}-${(data_to_check.getMonth() + 1).toString().padStart(2, "0")}-${data_to_check.getDate().toString().padStart(2, "0")}`)
            .set('x-access-token', token)
            .expect('Content-Type', /json/)
            .expect(200)
            .then((res) => {
                if (res.body) {
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
                }
            })
    })
})
