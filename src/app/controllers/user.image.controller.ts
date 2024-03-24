import {Request, Response} from "express";

import {authenticationToken, contentType, respond, respondImage} from "./common.controller";
import {deleteUserImage, getUserImage, uploadUserImage} from "../models/user.image.model";
import {getUserId} from "../services/sessions";


export async function getImage(request: Request, response: Response): Promise<void> {
    const userId = parseInt(request.params.id, 10);
    if (isNaN(userId)) {
        response.status(400).send("Invalid user id");
        return;
    }
    const callback = () => getUserImage(userId);
    await respondImage(response, callback);
}

export async function setImage(request: Request, response: Response): Promise<void> {
    const userId = parseInt(request.params.id, 10);
    if (isNaN(userId)) {
        response.status(400).send("Invalid user id");
        return;
    }
    const fileExtension = contentType(request).split('/')[1];
    if (fileExtension === undefined || !['png', 'jpeg', 'gif'].includes(fileExtension)) {
        response.status(400).send("Invalid content type, must be one of: png, jpeg, gif");
        return;
    }
    const callback = () => uploadUserImage(request.body as Buffer, userId, fileExtension);
    await respond(response, callback);
}

export async function deleteImage(request: Request, response: Response): Promise<void> {
    const userId = parseInt(request.params.id, 10);
    if (isNaN(userId)) {
        response.status(400).send("Invalid user id");
        return;
    }
    const token = authenticationToken(request);
    if (token === undefined) {
        response.status(401).send("Unauthenticated: No x-authorization header");
        return;
    }
    if (userId !== await getUserId(token)) {
        response.status(403).send("Forbidden: You may not delete another user's image");
        return;
    }
    const callback = () => deleteUserImage(userId);
    await respond(response, callback);
}
