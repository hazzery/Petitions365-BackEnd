import {ResultSetHeader, RowDataPacket} from "mysql2";

import {SupportTierPatch, SupportTierPost} from "../types/requestBodySchemaInterfaces";
import {runPreparedSQL} from "../../config/db";
import Logger from "../../config/logger";


export async function createSupportTier(
    body: SupportTierPost,
    petitionId: number
): Promise<[number, string, object | void]> {
    try {
        const result = await runPreparedSQL<ResultSetHeader>(
            `INSERT INTO support_tier (petition_id, title, description, cost)
             VALUES (?, ?, ?, ?);`,
            [petitionId, body.title, body.description, body.cost]
        );
        const supportTierId = result.insertId;
        return [201, "User registered!", {supportTierId}];
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
        `UPDATE support_tier
         SET title = ?,
             description = ?,
             cost = ?
         WHERE id = ?`,
        [body.title, body.description, body.cost, supportTierId]
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
