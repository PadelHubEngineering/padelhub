
import { describe, expect, test, jest, beforeAll} from '@jest/globals';
import request from 'supertest';
import { app } from '../../../src/routes/routes';
import { ERRORE_NON_AUTORIZZATO, ERRORE_TOKEN_NON_FORNITO, createTokenCircolo, createTokenGiocatore } from '../../utils/api.utils';
import { Giocatore, GiocatoreModel } from '../../../src/classes/Giocatore';
import { CircoloModel } from '../../../src/classes/Circolo';
import { Partita, PartitaModel } from '../../../src/classes/Partita';

function partita_testabile(partita: any, giocatori: Array<any>): {
    unicaPartita: Function,
    partitaDaControllare: Function
} {

    let populatePartita = jest.fn().mockImplementation( field => {
        if ( field === "giocatori" ) {
            return Promise.resolve({
                ...unicaPartita,
                // I giocatori passati hanno anche l'id. Ma qui non deve esserci
                giocatori: giocatori.map( e => ({ ...e, _id: undefined }) )
            })
        }
    })

    let unicaPartita = {
        ...partita,
        toObject: () => unicaPartita,
        populate: populatePartita
    }

    let partitaDaControllare = {
        ...partita,

        orario: partita.orario.toJSON(),
        giocatori
    }

    return {
        unicaPartita,
        partitaDaControllare
    }
}

describe("GET /api/v1/circolo/:idCircolo/partiteAperte/{data}", () => {

    const idGiocatore = "6477821d51672da362077de4"

    const giocatore_attuale = {
        nome: "Prova",
        cognome: "test",
        nickname: "provatest",
        foto: "",
        email: "testSuper@giocatore.com",
    }

    const circoloId = "6473381c54353c2f33ece86d"
    const email_circolo = "test@circolo.com"
    const orario_partita = new Date();

    let token: string | null = null

    beforeAll( () => {
        // Per trovare l'id del circolo
        GiocatoreModel.findOne = jest.fn().mockImplementation((criterias) => {
            return {
                exec: jest.fn().mockImplementation(() => {
                    if((<any>criterias).email == giocatore_attuale.email) {

                        return Promise.resolve({
                            ...giocatore_attuale,
                            _id: idGiocatore,
                            circoliAssociati: [],

                            calcolaCategoria: jest.fn().mockReturnValue(1)
                        })
                    }
                    return Promise.resolve(null)
                })
            }
        }) as any;

        CircoloModel.findOne = jest.fn().mockImplementation((criterias: any) => {
            return {
                exec: jest.fn().mockImplementation(() => {
                    console.log("Circolo " + criterias._id)
                    if ( criterias._id === circoloId )
                        return Promise.resolve({
                            _id: circoloId,
                            durataSlot: 60,
                            prezzoSlotOrario: 20
                        })
                    else
                        return Promise.resolve(null)
                })
            }
        }) as any;
    })

    test( "Scaricamento partite senza token di autenticazione", async () => {

        await request(app)
            .get(`/api/v1/circolo/647781e64b43cd91be829c27/partiteAperte/2023-06-13-08-00`)
            .expect('Content-Type', /json/)
            .expect(401)
            .then((res) => {
                if (res.body) {
                    expect(res.body).toHaveProperty("success", false)
                    expect(res.body).toHaveProperty("message", ERRORE_TOKEN_NON_FORNITO)
                }
            })
    } )


    test( "Prenotazione Slot Circolo, con data inserita nel body ma account non valido", async () => {

        const tokenInvalido = createTokenCircolo()

        await request(app)
            .get(`/api/v1/circolo/647781e64b43cd91be829c27/partiteAperte/2023-06-13-08-00`)
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

    test( "Token corretto, ma data formalmente corretta, ma non esistente", async () => {

        const token = createTokenGiocatore();

        await request(app)
            .get(`/api/v1/circolo/647781e64b43cd91be829c27/partiteAperte/2023-06-34-08-00`)
            .set('x-access-token', token)
            .expect('Content-Type', /json/)
            .expect(400)
            .then((res) => {
                if (res.body) {
                    expect(res.body).toHaveProperty("success", false)
                    expect(res.body).toHaveProperty("message", "Data fornita formalmente invalida")
                }
            })
    } )

    test( "Richiesta corretta, con id circolo formalmente errato", async () => {

        token = createTokenGiocatore();

        await request(app)
            .get(`/api/v1/circolo/provaprova/partiteAperte/2023-06-24-08-00`)
            .set('x-access-token', token)
            .expect('Content-Type', /json/)
            .expect(400)
            .then((res) => {
                if (res.body) {
                    expect(res.body).toHaveProperty("success", false)
                    expect(res.body).toHaveProperty("message", "L'id del circolo fornito non è valido")
                }
            })
    } )

    test( "Richiesta corretta, con id circolo formalmente corretto, ma inesistente", async () => {

        const fakeCircoloId = "6473381c54353c2f33ecfal50x"

        token = createTokenGiocatore(giocatore_attuale.email);

        await request(app)
            .get(`/api/v1/circolo/${fakeCircoloId}/partiteAperte/2023-06-24-08-00`)
            .set('x-access-token', token)
            .expect('Content-Type', /json/)
            .expect(400)
            .then((res) => {
                if (res.body) {
                    expect(res.body).toHaveProperty("success", false)
                    expect(res.body).toHaveProperty("message", "L'id del circolo fornito non è valido")
                }
            })
    } )


    test( "Richiesta corretta, giocatore con email non esistente", async () => {
        // Non imposto l'email del giocatore, come primo parametro
        token = createTokenGiocatore();

        await request(app)
            .get(`/api/v1/circolo/${circoloId}/partiteAperte/2023-06-24-08-00`)
            .set('x-access-token', token)
            .expect('Content-Type', /json/)
            .expect(500)
            .then((res) => {
                if (res.body) {
                    expect(res.body).toHaveProperty("success", false)
                    expect(res.body).toHaveProperty("message", "Errore interno, impossibile scaricare lista prenotazioni")
                }
            })


    })

    test( "Richiesta corretta, giocatore è già iscritto ad una partita", async () => {

        const { unicaPartita, partitaDaControllare } = partita_testabile(
            {
                _id: "647781e84b43cd91be829c3d",
                orario: orario_partita,
                categoria_max: 5,
                categoria_min: 1,
                tipoCampo: "Interno",
            },
            [ giocatore_attuale ]
        )

        PartitaModel.find = jest.fn().mockImplementationOnce((criterias: any) => {
            return {
                exec: jest.fn().mockImplementation(() => {
                    return Promise.resolve([
                        unicaPartita
                    ])
                })
            }
        }) as any;

        token = createTokenGiocatore(giocatore_attuale.email);

        await request(app)
            .get(`/api/v1/circolo/${circoloId}/partiteAperte/2023-06-24-08-00`)
            .set('x-access-token', token)
            .expect('Content-Type', /json/)
            .expect(200)
            .then((res) => {
                if (res.body) {
                    expect(res.body).toHaveProperty("success", true)
                    expect(res.body).toHaveProperty("payload")

                    expect(res.body.payload).toHaveProperty("giaPrenotato", true)
                    expect(res.body.payload).toHaveProperty("partite")

                    expect(res.body.payload.partite).toHaveLength(1)
                    expect(res.body.payload.partite[0]).toEqual( partitaDaControllare )
                }
            })

    })
    test( "Richiesta corretta, giocatore è già iscritto ma a più partite", async () => {

        let p: any[] = []

        p.push( partita_testabile(
            {
                _id: "647781e84b43cd91be829c3d",
                orario: orario_partita,
                categoria_max: 5,
                categoria_min: 1,
                tipoCampo: "Interno",
            },
            [ giocatore_attuale ]
        ) )

        p.push( partita_testabile(
            {
                _id: "647781e84b43cd91be953g9u",
                orario: orario_partita,
                categoria_max: 5,
                categoria_min: 1,
                tipoCampo: "Interno",
            },
            [ giocatore_attuale ]
        ) )

        PartitaModel.find = jest.fn().mockImplementationOnce((criterias: any) => {
            return {
                exec: jest.fn().mockImplementation(() => {
                    return Promise.resolve( p.map( ( e: any ) => e.unicaPartita ) )
                })
            }
        }) as any;

        token = createTokenGiocatore(giocatore_attuale.email);

        await request(app)
            .get(`/api/v1/circolo/${circoloId}/partiteAperte/2023-06-24-08-00`)
            .set('x-access-token', token)
            .expect('Content-Type', /json/)
            .expect(500)
            .then((res) => {
                if (res.body) {
                    expect(res.body).toHaveProperty("success", false)
                    expect(res.body).toHaveProperty("message", "Il giocatore non può essere iscritto a due partite contemporaneamente")
                }
            })
    })
    test( "Richiesta corretta, giocatore è già iscritto ad una partita, che però non è per la sua categoria", async () => {

        const { unicaPartita, partitaDaControllare } = partita_testabile(
            {
                _id: "647781e84b43cd91be829c3d",
                orario: orario_partita,
                categoria_max: 5,
                categoria_min: 4,
                tipoCampo: "Interno",
            },
            [ giocatore_attuale ]
        )

        PartitaModel.find = jest.fn().mockImplementationOnce((criterias: any) => {
            return {
                exec: jest.fn().mockImplementation(() => {
                    return Promise.resolve([
                        unicaPartita
                    ])
                })
            }
        }) as any;

        token = createTokenGiocatore(giocatore_attuale.email);

        await request(app)
            .get(`/api/v1/circolo/${circoloId}/partiteAperte/2023-06-24-08-00`)
            .set('x-access-token', token)
            .expect('Content-Type', /json/)
            .expect(200)
            .then((res) => {
                if (res.body) {
                    expect(res.body).toHaveProperty("success", true)
                    expect(res.body).toHaveProperty("payload")

                    expect(res.body.payload).toHaveProperty("giaPrenotato", true)
                    expect(res.body.payload).toHaveProperty("partite")

                    expect(res.body.payload.partite).toHaveLength(1)
                    expect(res.body.payload.partite[0]).toEqual( partitaDaControllare )
                }
            })
    })
    test( "Richiesta corretta, giocatore non è iscritto a partite, e quelle che ci sono sono per la sua categoria", async () => {


        let p: any[] = []

        p.push( partita_testabile(
            {
                _id: "647781e84b43cd91be829c3d",
                orario: orario_partita,
                categoria_max: 5,
                categoria_min: 1,
                tipoCampo: "Interno",
            },
            [ giocatore_attuale ]
        ) )

        p.push( partita_testabile(
            {
                _id: "647781e84b43cd91be953g9u",
                orario: orario_partita,
                categoria_max: 5,
                categoria_min: 1,
                tipoCampo: "Interno",
            },
            [ giocatore_attuale ]
        ) )

        PartitaModel.find = jest.fn().mockImplementationOnce((criterias: any) => {
            return {
                exec: jest.fn().mockReturnValueOnce([])
            }
        }).mockImplementationOnce((criterias: any) => {
            return {
                exec: jest.fn().mockReturnValueOnce(
                    Promise.resolve( p.map( (e: any) => e.unicaPartita ) )
                )
            }
        }) as any;

        token = createTokenGiocatore(giocatore_attuale.email);

        await request(app)
            .get(`/api/v1/circolo/${circoloId}/partiteAperte/2023-06-24-08-00`)
            .set('x-access-token', token)
            .expect('Content-Type', /json/)
            .expect(200)
            .then((res) => {
                console.log(res.body)
                if (res.body) {
                    expect(res.body).toHaveProperty("success", true)
                    expect(res.body).toHaveProperty("payload")

                    expect(res.body.payload).toHaveProperty("giaPrenotato", false)
                    expect(res.body.payload).toHaveProperty("partite")

                    expect(res.body.payload.partite).toHaveLength(p.length)
                }
            })

    })
    test( "Richiesta corretta, giocatore non è iscritto a partite, e quelle che ci sono, non sono per la sua categoria", async () => {

        PartitaModel.find = jest.fn().mockImplementationOnce((criterias: any) => {
            return {
                exec: jest.fn().mockReturnValueOnce( Promise.resolve([]))
            }
        }).mockImplementationOnce((criterias: any) => {
            return {
                exec: jest.fn().mockReturnValueOnce( Promise.resolve([]))
            }
        }) as any;

        token = createTokenGiocatore(giocatore_attuale.email);

        await request(app)
            .get(`/api/v1/circolo/${circoloId}/partiteAperte/2023-06-24-08-00`)
            .set('x-access-token', token)
            .expect('Content-Type', /json/)
            .expect(200)
            .then((res) => {
                console.log(res.body)
                if (res.body) {
                    expect(res.body).toHaveProperty("success", true)
                    expect(res.body).toHaveProperty("payload")

                    expect(res.body.payload).toHaveProperty("giaPrenotato", false)
                    expect(res.body.payload).toHaveProperty("partite")

                    expect(res.body.payload.partite).toHaveLength(0)
                }
            })

    })
})
