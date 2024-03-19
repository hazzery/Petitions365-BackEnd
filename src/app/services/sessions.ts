import {ResultSetHeader, RowDataPacket} from "mysql2";

import {runSQL} from "../../config/db";


const existingTokens = new Set<string>();

function generateToken(): string {
    return Math.random().toString(36).substring(2); // remove `0.`
}

export async function createSession(userId: number): Promise<string> {
    let token = generateToken();
    while (existingTokens.has(token)) {
        token = generateToken();
    }
    await runSQL(
        `UPDATE user
         SET auth_token = '${token}'
         WHERE id = ${userId};`
    );
    existingTokens.add(token);

    return token;
}

export async function deleteSession(token: string): Promise<boolean> {
    const result: ResultSetHeader = await runSQL(
        `UPDATE user
         SET auth_token = null
         WHERE auth_token = '${token}';`
    )
    return result.affectedRows > 0;
}

export async function getUserId(token: string): Promise<number | undefined> {
    interface User extends RowDataPacket {
        id: number;
    }
    const [user] = await runSQL<User[]>(
        `SELECT id
         FROM user
         WHERE auth_token = '${token}';`
    );
    return user?.id;
}
