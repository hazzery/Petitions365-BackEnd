import {PetitionPatch, PetitionPost, PetitionSearch} from "../types/requestBodySchemaInterfaces";
import {runSQL} from "../../config/db";
import {ResultSetHeader, RowDataPacket} from "mysql2";
import Logger from "../../config/logger";

export async function allPetitions(body: PetitionSearch): Promise<[number, string, object | void]> {
    return [501, "not implemented", void 0];
}

export async function singlePetition(petitionId: number): Promise<[number, string, object | void]> {
    interface Petition extends RowDataPacket {
        description: string;
        money_raised: number;
        id: number;
        title: string;
        category_id: number;
        owner_id: number;
        first_name: string;
        last_name: string;
        number_of_supporters: number;
        creation_date: string;
    }

    try {
        const [petition] = await runSQL<Petition[]>(
            `SELECT petition.description,
                    petition.id,
                    petition.title,
                    petition.category_id,
                    petition.owner_id,
                    user.first_name,
                    user.last_name,
                    COUNT(supporter.user_id) AS number_of_supporters,
                    petition.creation_date
             FROM petition
                      JOIN user ON user.id = petition.owner_id
                      JOIN support_tier ON petition.id = support_tier.petition_id
                      JOIN supporter ON petition.id = supporter.petition_id
             WHERE petition.id = ${petitionId}
             GROUP BY petition.id;`
        );
        Logger.info(Object.entries(petition).map(([key, value]: [any, any]) => key + " : " + value));
        const result = {
            description: petition.description,
            moneyRaised: petition.money_raised,
            supportTiers: [
                {}, {}, {}
            ],
            petitionId: petition.id,
            title: petition.title,
            categoryId: petition.category_id,
            ownerId: petition.owner_id,
            ownerFirstName: petition.first_name,
            ownerLastName: petition.last_name,
            numberOfSupporters: petition.number_of_supporters,
            creationDate: petition.creation_date
        }
        return [200, "Petition found", result];
    } catch (error) {
        return [404, `Petition with id ${petitionId} does not exist`, void 0];
    }
}

export async function createPetition(body: PetitionPost, ownerId: number): Promise<[number, string, object | void]> {
    try {
        const result = await runSQL<ResultSetHeader>(
            `INSERT INTO petition (title, description, creation_date, owner_id, category_id)
             VALUES ('${body.title}', '${body.description}', '${Date.now()}', '${ownerId}', ${12});`
        );
        const petitionId = result.insertId;
        return [201, "New petition created", {petitionId}];
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return [403, "Title already in use", void 0];
        } else throw error;
    }
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
