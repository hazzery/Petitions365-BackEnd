import {ResultSetHeader, RowDataPacket} from "mysql2";

import {PetitionPatch, PetitionPost, PetitionSearch} from "../types/requestBodySchemaInterfaces";
import {DetailedPetition, PetitionOverview, SupportTier} from "../types/databaseRowDataPackets";
import snakeToCamel from "../services/snakeToCamelConverter";
import {runPreparedSQL, runSQL} from "../../config/db";


export async function allPetitions(body: PetitionSearch): Promise<[number, string, object | void]> {
    const whereClause: string[] = [];
    if (body.ownerId) {
        whereClause.push(`owner.id = '${body.ownerId}'`);
    }
    if (body.q) {
        whereClause.push(`(petition.title LIKE '%${body.q}%' OR petition.description LIKE '%${body.q}%')`);
    }
    if (body.categoryIds) {
        if (Array.isArray(body.categoryIds)) {
            whereClause.push(`petition.category_id IN (${body.categoryIds.join(", ")})`);
        } else {
            whereClause.push(`petition.category_id = ${body.categoryIds}`);
        }
    }
    const havingClause: string[] = [];
    if (body.supportingCost) {
        havingClause.push(`MIN(support_tier.cost) <= ${body.supportingCost}`);
    }
    if (body.supporterId) {
        havingClause.push(`SUM(CASE WHEN supporter.user_id = ${body.supporterId} THEN 1 ELSE 0 END) > 0`);
    }
    let orderByClause: string;
    switch (body.sortBy) {
        case "ALPHABETICAL_ASC":
            orderByClause = "petition.title ASC,";
            break;
        case "ALPHABETICAL_DESC":
            orderByClause = "petition.title DESC,";
            break;
        case "COST_ASC":
            orderByClause = "MIN(support_tier.cost) ASC,";
            break;
        case "COST_DESC":
            orderByClause = "MIN(support_tier.cost) DESC,";
            break;
        case "CREATED_ASC":
            orderByClause = "petition.creation_date ASC,";
            break;
        case "CREATED_DESC":
            orderByClause = "petition.creation_date DESC,";
            break;
        default:
            orderByClause = "petition.creation_date ASC,";
            break;
    }
    const petitions = await runSQL<PetitionOverview[]>(
        `SELECT MIN(support_tier.cost)            AS supporting_cost,
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
                  JOIN support_tier ON support_tier.petition_id = petition.id
             ${whereClause.length > 0 ? `WHERE ${whereClause.join("AND ")}` : ""}
         GROUP BY petition.id ${havingClause.length > 0 ? `HAVING ${havingClause.join("AND ")}` : ""}
         ORDER BY ${orderByClause} petition.id ASC;`
    );
    const count = petitions.length;
    if (body.startIndex) {
        petitions.splice(0, parseInt(body.startIndex, 10));
    }
    if (body.count) {
        petitions.splice(parseInt(body.count, 10), petitions.length);
    }
    const camelCasePetitions = snakeToCamel(petitions);
    return [200, "All petitions matching given query have been sent", {petitions: camelCasePetitions, count}];
}

export async function singlePetition(petitionId: number): Promise<[number, string, object | void]> {
    try {
        const [petition] = await runSQL<DetailedPetition[]>(
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

export async function createPetition(
    body: PetitionPost, ownerId: number
): Promise<[number, string, { petitionId: number } | void]> {
    try {
        const result = await runPreparedSQL<ResultSetHeader>(
            `INSERT INTO petition (title, description, creation_date, owner_id, category_id)
             VALUES ('${body.title}', '${body.description}', ?, ${ownerId}, ${body.categoryId});`,
            [new Date()]
        );
        const petitionId = result.insertId;
        return [201, "New petition created", {petitionId}];
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return [403, "Title already in use", void 0];
        } else throw error;
    }
}

export async function updatePetition(body: PetitionPatch, petitionId: number, userId: number): Promise<[number, string, object | void]> {
    interface PetitionId extends RowDataPacket {
        owner_id: number
    }

    const [ownerId] = await runSQL<PetitionId[]>(
        `SELECT owner_id
         FROM petition
         WHERE id = ${petitionId};`
    );
    if (ownerId?.owner_id !== userId) {
        return [403, "Unable to edit other users' petitions", void 0];
    }
    const fieldsToUpdate: string[] = [];
    if (body.title) {
        fieldsToUpdate.push(`title = '${body.title}'`);
    }
    if (body.description) {
        fieldsToUpdate.push(`description = '${body.description}'`);
    }
    if (body.categoryId) {
        fieldsToUpdate.push(`category_id = ${body.categoryId}`);
    }
    if (fieldsToUpdate.length === 0) {
        return [400, "No fields to update", void 0];
    }
    await runSQL(
        `UPDATE petition
         SET ${fieldsToUpdate.join(", ")}
         WHERE id = ${petitionId};`
    );
    return [200, "Petition updated", void 0];
}

export async function removePetition(petitionId: number, userId: number): Promise<[number, string, object | void]> {
    interface Petition extends RowDataPacket {
        owner_id: number,
        number_of_supporters: number
    }

    const [petition] = await runSQL<Petition[]>(
        `SELECT owner_id, COUNT(supporter.user_id) AS number_of_supporters
         FROM petition
                  JOIN supporter ON supporter.petition_id = petition.id
         WHERE petition.id = ${petitionId}
         GROUP BY petition.id;`
    );
    if (!petition) {
        return [404, `Petition with id ${petitionId} does not exist`, void 0];
    }
    if (petition.owner_id !== userId) {
        return [403, "Unable to delete other users' petitions", void 0];
    }
    if (petition.number_of_supporters > 0) {
        return [403, "Unable to delete petition with supporters", void 0];
    }
    await runSQL(
        `DELETE
         FROM petition
         WHERE id = ${petitionId};`
    );
    return [200, "Petition deleted", void 0];
}

export async function allCategories(): Promise<[number, string, object | void]> {
    interface Category extends RowDataPacket {
        category_id: number,
        name: string
    }

    const categories = await runSQL<Category[]>(
        `SELECT id AS category_id, name
         FROM category;`
    );
    const camelCaseCategories = snakeToCamel(categories);
    return [200, "All categories found", camelCaseCategories];
}
