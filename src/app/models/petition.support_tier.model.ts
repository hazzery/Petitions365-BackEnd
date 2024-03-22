import {ResultSetHeader, RowDataPacket} from "mysql2";

import {SupportTierPatch, SupportTierPost} from "../types/requestBodySchemaInterfaces";
import {runPreparedSQL} from "../../config/db";
import Logger from "../../config/logger";


export async function createSupportTier(
    body: SupportTierPost,
    petitionId: number,
    userId: number
): Promise<[number, string, object | void]> {
    interface Petition extends RowDataPacket {
        owner_id: number,
        number_of_support_tiers: number
    }

    const [petition] = await runPreparedSQL<Petition[]>(
        `SELECT owner_id, COUNT(support_tier.id) AS number_of_support_tiers
         FROM petition
                  LEFT JOIN support_tier ON support_tier.petition_id = petition.id
         WHERE petition.id = ?
         GROUP BY petition.id`,
        [petitionId]
    );
    if (petition === undefined) {
        return [404, `Petition with id ${petitionId} not found`, void 0];
    }
    if (petition.owner_id !== userId) {
        return [403, `Forbidden: you do not own petition ${petitionId}`, void 0];
    }
    if (petition.number_of_support_tiers >= 3) {
        return [403, `Forbidden: petition ${petitionId} has reached the maximum number of support tiers`, void 0];
    }
    try {
        const result = await runPreparedSQL<ResultSetHeader>(
            `INSERT INTO support_tier (petition_id, title, description, cost)
             VALUES (?, ?, ?, ?);`,
            [petitionId, body.title, body.description, body.cost]
        );
        const supportTierId = result.insertId;
        return [201, `Created support tier ${supportTierId}!`, {supportTierId}];
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            Logger.warn(error.message);
            return [403, "Title already in use", void 0];
        } else throw error;
    }
}

export async function alterSupportTier(
    body: SupportTierPatch,
    petitionId: number,
    supportTierId: number,
    userId: number
): Promise<[number, string, void]> {
    interface SupportTier extends RowDataPacket {
        petition_id: number,
        owner_id: number,
        number_of_supporters: number
    }

    const [supportTier] = await runPreparedSQL<SupportTier[]>(
        `SELECT support_tier.petition_id, petition.owner_id, COUNT(supporter.id) AS number_of_supporters
         FROM support_tier
                  JOIN petition ON petition.id = support_tier.petition_id
                  LEFT JOIN supporter ON supporter.support_tier_id = support_tier.id
         WHERE support_tier.id = ?
         GROUP BY support_tier.id`,
        [supportTierId]
    );
    if (supportTier === undefined) {
        return [404, "Support tier not found", void 0];
    }
    if (supportTier.owner_id !== userId) {
        return [403, "Forbidden, you are not the owner of this petition", void 0];
    }
    if (supportTier.petition_id !== petitionId) {
        return [400, "Petition ID and Support Tier ID do not align", void 0];
    }
    if (supportTier.number_of_supporters > 0) {
        return [403, `Forbidden: Support tier ${supportTierId} has supporters`, void 0];
    }
    const fieldsToUpdate = [];
    if (body.title !== undefined) {
        fieldsToUpdate.push(`title = '${body.title}'`);
    }
    if (body.description !== undefined) {
        fieldsToUpdate.push(`description = '${body.description}'`);
    }
    if (body.cost !== undefined) {
        fieldsToUpdate.push(`cost = ${body.cost}`);
    }
    if (fieldsToUpdate.length === 0) {
        return [400, "No fields to update", void 0];
    }
    await runPreparedSQL(
        `UPDATE support_tier
         SET ${fieldsToUpdate.join(", ")}
         WHERE id = ?`,
        [supportTierId]
    );
    return [200, "Support tier updated", void 0];
}

export async function removeSupportTier(
    petitionId: number,
    supportTierId: number,
    userId: number
): Promise<[number, string, object | void]> {
    interface SupportTier extends RowDataPacket {
        petition_id: number,
        owner_id: number
    }

    const [supportTier] = await runPreparedSQL<SupportTier[]>(
        `SELECT support_tier.petition_id, petition.owner_id
         FROM support_tier
                  JOIN petition ON support_tier.petition_id = petition.id
         WHERE support_tier.id = ?`,
        [supportTierId]
    );
    if (supportTier === undefined) {
        return [404, "Support tier not found", void 0];
    }
    if (supportTier.petition_id !== petitionId) {
        return [400, "Petition ID and Support Tier ID do not align", void 0];
    }
    if (supportTier.owner_id !== userId) {
        return [403, "Forbidden, you are not the owner of this petition", void 0];
    }
    await runPreparedSQL(
        `DELETE FROM support_tier
         WHERE id = ?`,
        [supportTierId]
    );
    return [200, "Support tier deleted", void 0];
}
