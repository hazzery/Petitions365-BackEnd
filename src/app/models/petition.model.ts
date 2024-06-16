import {ResultSetHeader, RowDataPacket} from "mysql2";
import humps from "humps";

import {PetitionPatch, PetitionPost, PetitionSearch} from "../types/requestBodySchemaInterfaces";
import {DetailedPetition, PetitionOverview, SupportTier} from "../types/databaseRowDataPackets";
import {runPreparedSQL, runSQL} from "../../config/db";
import Logger from "../../config/logger";


function categoryExists(categoryId: string): Promise<boolean> {
    return new Promise((resolve) => {
        runPreparedSQL<RowDataPacket[]>(
            `SELECT id
             FROM category
             WHERE id = ?;`,
            [parseInt(categoryId, 10)]
        ).then(([category]) => {
            resolve(category !== undefined);
        });
    });
}

export async function allPetitions(body: PetitionSearch): Promise<[number, string, object | void]> {
    const whereClause: string[] = [];
    if (body.ownerId && !isNaN(parseInt(body.ownerId, 10))) {
        whereClause.push(`owner.id = ${body.ownerId}`);
    }
    if (body.q) {
        whereClause.push(`(petition.title LIKE '%${body.q}%' OR petition.description LIKE '%${body.q}%')`);
    }
    if (body.categoryIds) {
        if (Array.isArray(body.categoryIds)) {
            const results = await Promise.all(body.categoryIds.map(categoryExists));
            for (let i = 0; i < results.length; i++) {
                if (!results[i]) {
                    return [400, `Category with id ${body.categoryIds[i]} does not exist`, void 0];
                }
            }
            whereClause.push(`petition.category_id IN (${body.categoryIds.join(", ")})`);
        } else {
            if (!await categoryExists(body.categoryIds)) {
                return [400, `Category with id ${body.categoryIds} does not exist`, void 0];
            }
            whereClause.push(`petition.category_id = ${body.categoryIds}`);
        }
    }
    const havingClause: string[] = [];
    if (body.supportingCost && !isNaN(parseInt(body.supportingCost, 10))) {
        havingClause.push(`MIN(support_tier.cost) <= ${body.supportingCost}`);
    }
    if (body.supporterId && !isNaN(parseInt(body.supporterId, 10))) {
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
                  LEFT JOIN user AS owner ON owner.id = petition.owner_id
                  LEFT JOIN supporter ON supporter.petition_id = petition.id
                  LEFT JOIN support_tier ON support_tier.petition_id = petition.id
             ${whereClause.length > 0 ? `WHERE ${whereClause.join(" AND ")}` : ""}
         GROUP BY petition.id, petition.title, petition.creation_date ${havingClause.length > 0 ? `HAVING ${havingClause.join(" AND ")}` : ""}
         ORDER BY ${orderByClause} petition.id ASC;`
    );
    const totalCount = petitions.length;
    if (body.startIndex) {
        const startIndex = parseInt(body.startIndex, 10);
        if (startIndex >= 0 && startIndex < petitions.length) {
            petitions.splice(0, startIndex);
        } else {
            return [400, "invalid startIndex", void 0];
        }
    }
    if (body.count) {
        const count = parseInt(body.count, 10);
        if (count >= 0 && count <= petitions.length) {
            petitions.splice(count, petitions.length);
        } else {
            return [400, "invalid count", void 0];
        }
    }
    const camelCasePetitions = humps.camelizeKeys(petitions);
    return [200, "All petitions matching given query have been sent", {petitions: camelCasePetitions, count: totalCount}];
}

export async function singlePetition(petitionId: number): Promise<[number, string, object | void]> {
    const [petition] = await runPreparedSQL<DetailedPetition[]>(
        `SELECT petition.description,
                CAST(SUM(support_tier.cost) AS INT) AS money_raised,
                petition.id                         AS petition_id,
                petition.title                      AS title,
                petition.category_id                AS category_id,
                petition.owner_id                   AS owner_id,
                owner.first_name                    AS owner_first_name,
                owner.last_name                     AS owner_last_name,
                COUNT(supporter.user_id)            AS number_of_supporters,
                petition.creation_date              AS creation_date
         FROM petition
                  JOIN user AS owner ON owner.id = petition.owner_id
                  LEFT JOIN supporter ON supporter.petition_id = petition.id
                  LEFT JOIN support_tier ON support_tier.id = supporter.support_tier_id
         WHERE petition.id = ?
         GROUP BY petition.id;`,
        [petitionId]
    );
    if (petition === undefined) {
        return [404, `Petition with id ${petitionId} does not exist`, void 0];
    }
    const camelCasePetition = humps.camelizeKeys(petition) as any;
    camelCasePetition.supportTiers = humps.camelizeKeys(await runPreparedSQL<SupportTier[]>(
        `SELECT id AS support_tier_id, title, description, cost
         FROM support_tier
         WHERE petition_id = ?;`,
        [petitionId]
    ));
    return [200, `Petition ${petitionId} found`, camelCasePetition];
}

export async function createPetition(
    body: PetitionPost, ownerId: number
): Promise<[number, string, { petitionId: number } | void]> {
    try {
        const tierNames = new Set();
        for (const supportTier of body.supportTiers) {
            tierNames.add(supportTier.title);
        }
        if (tierNames.size !== body.supportTiers.length) {
            return [400, "Support tier titles must be unique", void 0];
        }
        const [category] = await runPreparedSQL<RowDataPacket[]>(
            `SELECT id
             FROM category
             WHERE id = ?;`,
            [body.categoryId]
        );
        if (category === undefined) {
            return [400, `Category with id ${body.categoryId} does not exist`, void 0];
        }
        const petitionResult = await runPreparedSQL<ResultSetHeader>(
            `INSERT INTO petition (title, description, creation_date, owner_id, category_id)
             VALUES ('${body.title}', '${body.description}', ?, ${ownerId}, ${body.categoryId});`,
            [new Date()]
        );
        const petitionId = petitionResult.insertId;
        for (const supportTier of body.supportTiers) {
            await runPreparedSQL<ResultSetHeader>(
                `INSERT INTO support_tier (petition_id, title, description, cost)
                 VALUES (?, ?, ?, ?);`,
                [petitionId, supportTier.title, supportTier.description, supportTier.cost]
            );
        }
        return [201, `Created petition ${petitionId}`, {petitionId}];
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return [403, `Title '${body.title}' is already in use`, void 0];
        }
        throw error;
    }
}

export async function updatePetition(body: PetitionPatch, petitionId: number, userId: number): Promise<[number, string, object | void]> {
    interface PetitionId extends RowDataPacket {
        owner_id: number
    }

    const [ownerId] = await runPreparedSQL<PetitionId[]>(
        `SELECT owner_id
         FROM petition
         WHERE id = ?;`,
        [petitionId]
    );
    if (ownerId?.owner_id !== userId) {
        return [403, `Unable to edit petition ${petitionId}, it is not your petition`, void 0];
    }
    const fieldsToUpdate: string[] = [];
    if (body.title) {
        fieldsToUpdate.push(`title = '${body.title}'`);
    }
    if (body.description) {
        fieldsToUpdate.push(`description = '${body.description}'`);
    }
    if (body.categoryId) {
        if (!await categoryExists(body.categoryId)) {
            return [400, `Category with id ${body.categoryId} does not exist`, void 0];
        }
        fieldsToUpdate.push(`category_id = ${body.categoryId}`);
    }
    if (fieldsToUpdate.length === 0) {
        return [400, "No fields to update", void 0];
    }
    try {
        const result = await runPreparedSQL<ResultSetHeader>(
            `UPDATE petition
             SET ${fieldsToUpdate.join(", ")}
             WHERE id = ?;`,
            [petitionId]
        );
        if (result === undefined || result.affectedRows === 0) {
            return [404, `Petition with id ${petitionId} does not exist`, void 0];
        }
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            Logger.warn(error.message);
            return [403, "Petition title already in use", void 0];
        }
        throw error;
    }
    return [200, `Petition ${petitionId} updated`, void 0];
}

export async function removePetition(petitionId: number, userId: number): Promise<[number, string, object | void]> {
    interface Petition extends RowDataPacket {
        owner_id: number,
        number_of_supporters: number
    }

    const [petition] = await runPreparedSQL<Petition[]>(
        `SELECT owner_id, COUNT(supporter.user_id) AS number_of_supporters
         FROM petition
                  LEFT JOIN supporter ON supporter.petition_id = petition.id
         WHERE petition.id = ?
         GROUP BY petition.id;`,
        [petitionId]
    );
    if (!petition) {
        return [404, `Petition with id ${petitionId} does not exist`, void 0];
    }
    if (petition.owner_id !== userId) {
        return [403, `Unable to delete petition ${petitionId}, it is not your petition`, void 0];
    }
    if (petition.number_of_supporters > 0) {
        return [403, `Unable to delete petition ${petitionId}, it has more than 0 supporters`, void 0];
    }
    await runPreparedSQL(
        `DELETE
         FROM petition
         WHERE id = ?;`,
        [petitionId]
    );
    return [200, `Petition ${petitionId} deleted`, void 0];
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
    const camelCaseCategories = humps.camelizeKeys(categories);
    return [200, "All categories found", camelCaseCategories];
}
