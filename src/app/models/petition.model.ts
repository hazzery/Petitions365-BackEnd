import {PetitionPatch, PetitionPost, PetitionSearch} from "../types/requestBodySchemaInterfaces";

export async function allPetitions(body: PetitionSearch): Promise<[number, string, object | void]> {
    return [501, "not implemented", void 0];
}

export async function singlePetition(petitionId: number): Promise<[number, string, object | void]> {
    return [501, "not implemented", void 0];
}

export async function createPetition(body: PetitionPost): Promise<[number, string, object | void]> {
    return [501, "not implemented", void 0];
}

export async function updatePetition(body: PetitionPatch): Promise<[number, string, object | void]> {
    return [501, "not implemented", void 0];
}

export async function removePetition(petitionId: number): Promise<[number, string, object | void]> {
    return [501, "not implemented", void 0];
}

export async function allCategories(): Promise<[number, string, object | void]> {
    return [501, "not implemented", void 0];
}
