import {Request, Response} from "express";

import {PetitionPost} from "../types/requestBodySchemaInterfaces";
import {processRequestBody, respond} from './common.controller';
import {
    allCategories,
    allPetitions,
    createPetition,
    removePetition,
    singlePetition,
    updatePetition
} from "../models/petition.model";
import * as schemas from '../resources/schemas.json'

export async function getAllPetitions(request: Request, response: Response): Promise<void> {
    const callback = async () => processRequestBody(request.query, schemas.petition_search, allPetitions);
    await respond(response, callback);
}

export async function getPetition(request: Request, response: Response): Promise<void> {
    const callback = async () => singlePetition(parseInt(request.params.id, 10));
    await respond(response, callback);
}

export async function addPetition(request: Request, response: Response): Promise<void> {
    const makePetition = async (body: PetitionPost) => createPetition(body, parseInt(request.params.id, 10))
    const callback = async () => processRequestBody(request.body, schemas.petition_post, makePetition);
    await respond(response, callback);
}

export async function editPetition(request: Request, response: Response): Promise<void> {
    const callback = async () => processRequestBody(request.body, schemas.petition_patch, updatePetition);
    await respond(response, callback);
}

export async function deletePetition(request: Request, response: Response): Promise<void> {
    const callback = async () => removePetition(parseInt(request.params.id, 10));
    await respond(response, callback);
}

export async function getCategories(_request: Request, response: Response): Promise<void> {
    await respond(response, allCategories);
}
