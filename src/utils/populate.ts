import { Circolo, CircoloModel, GiornoSettimana, OrarioGiornaliero, ServizioAggiuntivo } from "../classes/Circolo";
import { GiocatoreModel } from "../classes/Giocatore";
import { PrenotazioneCampoModel } from "../classes/PrenotazioneCampo";
import { UtenteModel } from "../classes/Utente";

export async function populate(){
    await PrenotazioneCampoModel.deleteMany({})
    await UtenteModel.deleteMany({});
    const c: Circolo = new Circolo("Matteo", "matteo2@gmail.com", "1234");
    c.serviziAggiuntivi?.push(new ServizioAggiuntivo("Bagni", "Puliti"))
    c.orarioSettimanale.forEach( (orario: OrarioGiornaliero) => {
        orario.orarioApertura.setUTCHours(7,0);
        orario.orarioChiusura.setUTCHours(10,0)
    });
    c.durataSlot = 60;

    //console.log(c)
    //await CircoloModel.create(c);
}

export function testCircolo(){
    const c: Circolo = new Circolo("Matteo", "matteo2@gmail.com", "1234");
    c.serviziAggiuntivi?.push(new ServizioAggiuntivo("Bagni", "Puliti"))
    c.orarioSettimanale.forEach( (orario: OrarioGiornaliero) => {
        orario.orarioApertura.setUTCHours(7,0);
        orario.orarioChiusura.setUTCHours(10,0)
    });
    c.durataSlot = 90;
    console.log(c.getRangeByTimeSlot(2, GiornoSettimana.Giovedi));
}