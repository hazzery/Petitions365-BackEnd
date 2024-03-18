import {ResultSetHeader} from "mysql2";

import {PetitionPatch, PetitionPost, PetitionSearch} from "../types/requestBodySchemaInterfaces";
import {Petition, SupportTier} from "../types/databaseRowDataPackets";
import snakeToCamel from "../services/snakeToCamelConverter";
import {runSQL} from "../../config/db";

export async function allPetitions(body: PetitionSearch): Promise<[number, string, object | void]> {
    return [501, "not implemented", void 0];
}

export async function singlePetition(petitionId: number): Promise<[number, string, object | void]> {
    try {
        const [petition] = await runSQL<Petition[]>(
            `SELECT petition.description,
                    SUM(support_tier.cost)            AS money_raised,
                    petition.id                       AS petition_id,
                    petition.title                    AS title,
                    petition.category_id              AS category_id,
                    petition.owner_id                 AS owner_id,
                    owner.first_name                  AS owner_first_name,
                    owner.last_name                   AS owner_last_name,
                    COUNT(DISTINCT supporter.user_id) AS number_of_supporters,
                    petition.creation_date            AS creation_date
             FROM petition
                      JOIN user AS owner ON owner.id = petition.owner_id
                      JOIN supporter ON supporter.petition_id = petition.id
                      JOIN support_tier ON support_tier.id = supporter.support_tier_id
             WHERE petition.id = ${petitionId}
             GROUP BY petition.id;`
        );
        const camelCasePetition = snakeToCamel(petition);
        camelCasePetition.supportTiers = snakeToCamel(await runSQL<SupportTier[]>(
            `SELECT id AS support_tier_id, title, description, cost
             FROM support_tier
             WHERE petition_id = ${petitionId};`
        ));
        return [200, "Petition found", camelCasePetition];
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
