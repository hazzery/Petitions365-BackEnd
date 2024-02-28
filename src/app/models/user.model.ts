import {UserRegister} from "../types/requestBodySchemaInterfaces";
import Logger from "../../config/logger";
import {getPool} from "../../config/db";

const MINIMUM_PASSWORD_LENGTH = 6;

const runSQL = async (sql: string) => {
    const connection = await getPool()?.getConnection();
    if (connection === undefined) {
        throw new Error('Not connected to database!');
    }
    const result = await connection.query(sql);
    connection.release();
    return result
}

export const registerUser = async (data: UserRegister): Promise<[number, string, void]> => {
    if (data.password.length < MINIMUM_PASSWORD_LENGTH) {
        return [400, `Password must be at least ${MINIMUM_PASSWORD_LENGTH} characters.`, null];
    }
    // This regex looks gross, but confirms email approximately matches this format: 'x@y.z'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        return [400, "Invalid email address", null];
    }
    try {
        await runSQL(`INSERT INTO user (email, first_name, last_name, password)
                             VALUES ('${data.email}', '${data.firstName}', '${data.lastName}', '${data.password}')`);
        return [200, "User registered!", null];
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            Logger.warn(error.message);
            return [403, "Email address already in use", null];
        }
        else throw error;
    }
}
