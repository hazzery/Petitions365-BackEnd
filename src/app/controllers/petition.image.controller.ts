import {Request, Response} from "express";

import {authenticationToken, contentType, respond, respondImage} from "./common.controller";
import {getPetitionImage, uploadPetitionImage} from "../models/petition.image.model";
import {getUserId} from "../services/sessions";


export async function getImage(request: Request, response: Response): Promise<void> {
    const petitionId = parseInt(request.params.id, 10);
    if (isNaN(petitionId)) {
        response.status(400).send("Invalid petition id");
        return;
    }
    const callback = () => getPetitionImage(petitionId);
    await respondImage(response, callback);
}

export async function setImage(request: Request, response: Response): Promise<void> {
    const petitionId = parseInt(request.params.id, 10);
    if (isNaN(petitionId)) {
        response.status(400).send("Invalid petition id");
        return;
    }
    const token = authenticationToken(request);
    if (token === undefined) {
        response.status(401).send("Unauthenticated: No x-authorization header");
        return;
    }
    const userId = await getUserId(token)
    if (userId === undefined) {
        response.status(401).send("Unauthenticated: Invalid token");
        return;
    }
    const fileExtension = contentType(request).split('/')[1];
    if (fileExtension === undefined || !['png', 'jpeg', 'gif'].includes(fileExtension)) {
        response.status(400).send("Invalid content type, must be one of: png, jpeg, gif");
        return;
    }
    const callback = () => uploadPetitionImage(request.body as Buffer, petitionId, fileExtension, userId);
    await respond(response, callback);
}
