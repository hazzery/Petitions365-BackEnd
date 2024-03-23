import {ResultSetHeader, RowDataPacket} from "mysql2";

import {SupportPost} from "../types/requestBodySchemaInterfaces";
import {runPreparedSQL} from "../../config/db";
import humps from "humps";

export async function getAllSupporters(petitionId: number): Promise<[number, string, object | void]> {
    interface Supporter extends RowDataPacket {
        support_id: number,
        support_tier_id: number,
        message: string,
        supporter_id: number,
        supporter_first_name: string,
        supporter_last_name: string,
        "timestamp": string
    }

    const supporters = await runPreparedSQL<Supporter[]>(
        `SELECT supporter.id      AS support_id,
                supporter.support_tier_id,
                supporter.message,
                supporter.user_id AS supporter_id,
                user.first_name   AS supporter_first_name,
                user.last_name    AS supporter_last_name,
                supporter.timestamp
         FROM supporter
                  JOIN user ON user.id = supporter.user_id
         WHERE supporter.petition_id = ?
         ORDER BY supporter.timestamp DESC;`,
        [petitionId]
    );
    const camelCaseSupporters = humps.camelizeKeys(supporters);
    return [200, `Listed all supporters of petition ${petitionId}`, camelCaseSupporters];
}

export async function addNewSupporter(body: SupportPost, petitionId: number, userId: number): Promise<[number, string, object | void]> {
    interface Petition extends RowDataPacket {
        owner_id: number
    }

    const [petition] = await runPreparedSQL<Petition[]>(
        `SELECT owner_id
         FROM petition
         WHERE id = ?;`,
        [petitionId]
    );
    if (petition === undefined) {
        return [404, `Petition ${petitionId} not found`, void 0];
    }
    if (petition.owner_id === userId) {
        return [403, `You (${userId}) cannot support your own petition (${petitionId})`, void 0];
    }
    try {
        const result = await runPreparedSQL<ResultSetHeader>(
            `INSERT INTO supporter (petition_id, support_tier_id, user_id, message)
             VALUES (?, ?, ?, ?);`,
            [petitionId, body.supportTierId, userId, body.message]
        );
        return [201, `Supporter ${result.insertId} added`, {supporterId: result.insertId}];
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return [403, `You (${userId}) are already supporting tier ${body.supportTierId} of petition ${petitionId}`, void 0];
        }
        throw error;
    }
}
