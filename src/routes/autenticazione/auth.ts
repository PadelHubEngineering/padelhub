import { Router, Request, Response } from 'express';
import { Utente, UtenteModel } from '../../classes/Utente';

const router: Router = Router();

router.post('', async function (req: Request, res: Response) {
    var searched = (await UtenteModel.findOne({ email: req.body.email }));
    const usr: Utente = searched != null ? searched : (new Utente('','',''));
    //res.send(`Utente ${usr.name} autenticato. Telefono: ${usr.telefono}.`);
});
export default router;
