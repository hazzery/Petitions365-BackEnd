import {Request, Response} from "express";

import {authenticationToken, processRequestBody, respond} from "./common.controller";
import {addNewSupporter, getAllSupporters} from "../models/petition.supporter.model";
import {SupportPost} from "../types/requestBodySchemaInterfaces";
import * as schemas from "../resources/schemas.json";
import {getUserId} from "../services/sessions";


export async function getAllSupportersForPetition(request: Request, response: Response): Promise<void> {
    const petitionId = parseInt(request.params.id, 10);
    if (isNaN(petitionId)) {
        response.status(400).send("Invalid petition id");
        return;
    }
    const callback = () => getAllSupporters(petitionId);
    await respond(response, callback);
}

export async function addSupporter(request: Request, response: Response): Promise<void> {
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
    const userId = await getUserId(token);
    if (userId === undefined) {
        response.status(401).send("Unauthenticated: Invalid token");
        return;
    }
    const supportPetition = async (body: SupportPost) => addNewSupporter(body, petitionId, userId);
    const callback = async () => processRequestBody(request.body, schemas.support_post, supportPetition);
    await respond(response, callback);
}
