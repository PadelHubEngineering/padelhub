import { Router, Request, Response } from "express";
import { CircoloModel } from "../../classes/Circolo";
import axios from 'axios';
import { logger } from "../../utils/logging";
import { sendHTTPResponse } from "../../utils/general.utils";

const router = Router();

router.get('/:location', async (req: Request, res: Response) => {
    const location: string = req.params.location;
    let locationURI: string = "";
    const bingRoute = (waypoint1: String, waypoint2: string) => {
        return `https://dev.virtualearth.net/REST/V1/Routes/Driving?o=json&wp.0=${waypoint1}&wp.1=${waypoint2}&key=${process.env.BING_MAP_KEY}`
    }

    try {
        locationURI = decodeURI(location)
    }
    catch {
        logger.error("URI waypoint non valido")
        sendHTTPResponse(res, 400, false, "URI waypoint non valido")
    }


    const circoli = await CircoloModel.find({}).exec()
    const results: any[] = []

    for await (const circolo of circoli) {
        if (circolo) {
            if (circolo.indirizzo) {
                const { data, status } = await axios.get(bingRoute(locationURI, encodeURI(circolo.indirizzo)));
                if (status == 200) {
                    //console.log(data)
                    console.log("push")
                    results.push(data)
                }
            }
        }
    }

    console.log("stampo")
    console.log(results)
    sendHTTPResponse(res, 200, true, "OK");
})

export default router;