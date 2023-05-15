import { Circolo, CircoloModel, OrarioGiornaliero, ServizioAggiuntivo } from "../classes/Circolo";
import { GiocatoreModel } from "../classes/Giocatore";
import { PrenotazioneCampoModel } from "../classes/PrenotazioneCampo";
import { UtenteModel } from "../classes/Utente";

export async function populate(){
    await PrenotazioneCampoModel.deleteMany({})
    await UtenteModel.deleteMany({});
    const c: Circolo = new Circolo("Matteo", "matteo2@gmail.com", "1234");
    c.serviziAggiuntivi?.push(new ServizioAggiuntivo("Bagni", "Puliti"))
    //console.log(c)
    await CircoloModel.create(c);
}