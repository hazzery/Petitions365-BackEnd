import {Request, Response} from "express";

import {uploadUserImage} from "../models/user.image.model";
import {contentType, respond} from "./common.controller";


export async function getImage(request: Request, response: Response): Promise<void> {

}

export async function setImage(request: Request, response: Response): Promise<void> {
    const petitionId = parseInt(request.params.id, 10);
    if (isNaN(petitionId)) {
        response.status(400).send("Invalid petition id");
        return;
    }
    const fileExtension = contentType(request).split('/')[1];
    if (fileExtension === undefined || !['png', 'jpeg', 'gif'].includes(fileExtension)) {
        response.status(400).send("Invalid content type, must be one of: png, jpeg, gif");
        return;
    }
    const callback = () => uploadUserImage(request.body as Buffer, petitionId, fileExtension);
    await respond(response, callback);
}
