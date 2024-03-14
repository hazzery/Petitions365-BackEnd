import {Request, Response} from "express";

import * as schemas from '../resources/schemas.json'
import {processRequestBody, respond} from './common.controller';
import {
    allCategories,
    allPetitions,
    createPetition,
    removePetition,
    singlePetition,
    updatePetition
} from "../models/petition.model";

export async function getAllPetitions(request: Request, response: Response): Promise<void> {
    const callback = async () => processRequestBody(request, schemas.petition_search, allPetitions);
    await respond(response, callback);
}

export async function getPetition(request: Request, response: Response): Promise<void> {
    const callback = async () => singlePetition(parseInt(request.params.id, 10));
    await respond(response, callback);
}

export async function addPetition(request: Request, response: Response): Promise<void> {
    const callback = async () => processRequestBody(request, schemas.petition_post, createPetition);
    await respond(response, callback);
}

export async function editPetition(request: Request, response: Response): Promise<void> {
    const callback = async () => processRequestBody(request, schemas.petition_patch, updatePetition);
    await respond(response, callback);
}

export async function deletePetition(request: Request, response: Response): Promise<void> {
    const callback = async () => removePetition(parseInt(request.params.id, 10));
    await respond(response, callback);
}

export async function getCategories(_request: Request, response: Response): Promise<void> {
    await respond(response, allCategories);
}
