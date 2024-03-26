import {Request, Response} from "express";

import {authenticationToken, processRequestBody, respond} from './common.controller';
import {PetitionPatch, PetitionPost} from "../types/requestBodySchemaInterfaces";
import {
    allCategories,
    allPetitions,
    createPetition,
    removePetition,
    singlePetition,
    updatePetition
} from "../models/petition.model";
import * as schemas from '../resources/schemas.json'
import {getUserId} from "../services/sessions";

export async function getAllPetitions(request: Request, response: Response): Promise<void> {
    const callback = async () => await processRequestBody(request.query, schemas.petition_search, allPetitions);
    await respond(response, callback);
}

export async function getPetition(request: Request, response: Response): Promise<void> {
    const petitionId = parseInt(request.params.id, 10);
    if (isNaN(petitionId)) {
        response.status(400).send("Invalid petition id");
        return;
    }
    const callback = async () => await singlePetition(petitionId);
    await respond(response, callback);
}

export async function addPetition(request: Request, response: Response): Promise<void> {
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
    const makePetition = async (body: PetitionPost) => await createPetition(body, userId)
    const callback = async () => await processRequestBody(request.body, schemas.petition_post, makePetition);
    await respond(response, callback);
}

export async function editPetition(request: Request, response: Response): Promise<void> {
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
    const petitionId = parseInt(request.params.id, 10);
    if (isNaN(petitionId)) {
        response.status(400).send("Invalid petition id");
        return;
    }
    const patchPetition = async (body: PetitionPatch) => await updatePetition(body, petitionId, userId);
    const callback = async () => await processRequestBody(request.body, schemas.petition_patch, patchPetition);
    await respond(response, callback);
}

export async function deletePetition(request: Request, response: Response): Promise<void> {
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
    const petitionId = parseInt(request.params.id, 10);
    if (isNaN(petitionId)) {
        response.status(400).send("Invalid petition id");
        return;
    }
    const callback = async () => await removePetition(petitionId, userId);
    await respond(response, callback);
}

export async function getCategories(_request: Request, response: Response): Promise<void> {
    await respond(response, allCategories);
}
