import {UserRegister} from "../types/requestBodySchemaInterfaces";
import Logger from "../../config/logger";
import {getPool} from "../../config/db";

const MINIMUM_PASSWORD_LENGTH = 6;

const generateToken = () => {
    return Math.random().toString(36).substring(2); // remove `0.`
};

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

export const loginUser = async (data: {email: string, password: string}): Promise<[number, string, object]> => {
    const result = await runSQL(`SELECT id FROM user WHERE email = '${data.email}' AND password = '${data.password}'`);
    const users = result[0] as { id: number }[]
    if (users.length === 0) {
        return [401, "Invalid email or password", null];
    }
    return [200, "User logged in!", {userId: users[0].id, token: generateToken()}];
}

