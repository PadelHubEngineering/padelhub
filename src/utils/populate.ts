import { Circolo, CircoloModel, GiornoSettimana, OrarioGiornaliero, TipoCampo } from "../classes/Circolo";
import { GiocatoreModel } from "../classes/Giocatore";
import { PrenotazioneCampoModel } from "../classes/PrenotazioneCampo";
import { UtenteModel } from "../classes/Utente";

export async function deleteBefore(){
    await PrenotazioneCampoModel.deleteMany({})
    await UtenteModel.deleteMany({});
}

export async function populate(){

    const c: Circolo = new Circolo("Matteo", "matteo2@gmail.com", "1234");
    c.serviziAggiuntivi?.push("Bagni Puliti")
    c.orarioSettimanale.forEach( (orario: OrarioGiornaliero) => {
        orario.orarioApertura.setUTCHours(7,0);
        orario.orarioChiusura.setUTCHours(18,0)
    });
    c.durataSlot = 60;
    c.campi.push({id: 1, tipologia: TipoCampo.Esterno})
    c.campi.push({id: 2, tipologia: TipoCampo.Esterno})
    c.campi.push({id: 3, tipologia: TipoCampo.Interno})
    c.campi.push({id: 4, tipologia: TipoCampo.Interno})



    //console.log(c)
    await CircoloModel.create(c);
}