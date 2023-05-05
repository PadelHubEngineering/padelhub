import { Router, Request, Response } from 'express';
const router: Router = Router();

router.post('', async function (req: Request, res: Response) {
    res.send("Login Page");
});

export default router;
