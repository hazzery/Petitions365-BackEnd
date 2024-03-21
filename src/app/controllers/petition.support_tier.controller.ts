import {Request, Response} from "express";
import {authenticationToken, processRequestBody, respond} from "./common.controller";
import * as schemas from "../resources/schemas.json";
import {alterSupportTier, createSupportTier, removeSupportTier} from "../models/petition.support_tier.model";
import {SupportTierPatch, SupportTierPost} from "../types/requestBodySchemaInterfaces";
import {getUserId} from "../services/sessions";


export async function addSupportTier(request: Request, response: Response): Promise<void> {
    const petitionId = parseInt(request.params.id, 10);
    if (isNaN(petitionId)) {
        response.status(400).send("Invalid petition ID");
        return;
    }
    const token = authenticationToken(request);
    if (!token) {
        response.status(401).send("Unauthenticated: No x-authorization header");
        return;
    }
    const newSupportTier = (body: SupportTierPost) => createSupportTier(body, petitionId);
    const callback = () => processRequestBody(request.body, schemas.support_tier_post, newSupportTier);
    await respond(response, callback);
}

export async function editSupportTier(request: Request, response: Response): Promise<void> {
    const petitionId = parseInt(request.params.id, 10);
    if (isNaN(petitionId)) {
        response.status(400).send("Invalid petition ID");
        return;
    }
    const supportTierId = parseInt(request.params.tierId, 10);
    if (isNaN(supportTierId)) {
        response.status(400).send("Invalid support tier ID");
        return;
    }
    const token = authenticationToken(request);
    if (!token) {
        response.status(401).send("Unauthenticated: No x-authorization header");
        return;
    }
    const userId = await getUserId(token);
    if (!userId) {
        response.status(401).send("Unauthenticated: Invalid token");
        return;
    }
    const patchSupportTier = (body: SupportTierPatch) => alterSupportTier(body, petitionId, supportTierId, userId);
    const callback = () => processRequestBody(request.body, schemas.support_tier_patch, patchSupportTier);
    await respond(response, callback);
}

export async function deleteSupportTier(request: Request, response: Response): Promise<void> {
    const petitionId = parseInt(request.params.id, 10);
    if (isNaN(petitionId)) {
        response.status(400).send("Invalid petition ID");
        return;
    }
    const supportTierId = parseInt(request.params.tierId, 10);
    if (isNaN(supportTierId)) {
        response.status(400).send("Invalid support tier ID");
        return;
    }
    const token = authenticationToken(request);
    if (!token) {
        response.status(401).send("Unauthenticated: No x-authorization header");
        return;
    }
    const userId = await getUserId(token);
    if (!userId) {
        response.status(401).send("Unauthenticated: Invalid token");
        return;
    }
    const callback = () => removeSupportTier(petitionId, supportTierId, userId);
    await respond(response, callback);
}
