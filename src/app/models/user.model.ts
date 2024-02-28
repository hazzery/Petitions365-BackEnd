import {UserLogin, UserRegister} from "../types/requestBodySchemaInterfaces";
import {createSession, deleteSession} from "../services/sessions";
import {compare, hash} from "../services/passwords";
import Logger from "../../config/logger";
import {getPool} from "../../config/db";


const MINIMUM_PASSWORD_LENGTH = 6;

async function runSQL(sql: string): Promise<any> {
    const connection = await getPool()?.getConnection();
    if (connection === undefined) {
        throw new Error('Not connected to database!');
    }
    const result = await connection.query(sql);
    connection.release();
    return result
}

export async function registerUser(data: UserRegister): Promise<[number, string, void]> {
    if (data.password.length < MINIMUM_PASSWORD_LENGTH) {
        return [400, `Password must be at least ${MINIMUM_PASSWORD_LENGTH} characters.`, null];
    }
    // This regex looks gross, but confirms email approximately matches this format: 'x@y.z'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        return [400, "Invalid email address", null];
    }
    const hashedPassword = await hash(data.password);
    try {
        await runSQL(`INSERT INTO user (email, first_name, last_name, password)
                      VALUES ('${data.email}', '${data.firstName}', '${data.lastName}', '${hashedPassword}')`);
        return [200, "User registered!", null];
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            Logger.warn(error.message);
            return [403, "Email address already in use", null];
        } else throw error;
    }
}

export async function loginUser(data: UserLogin): Promise<[number, string, object]> {
    const result = await runSQL(`SELECT id, password
                                 FROM user
                                 WHERE email = '${data.email}'`);
    const users = result[0] as { id: number, password: string }[]
    if (users.length === 0) {
        return [401, "Email not registered", null];
    }
    if (await compare(data.password, users[0].password)) {
        return [200, "User logged in!", {userId: users[0].id, token: createSession(users[0].id)}];
    } else {
        return [401, "Incorrect password", null];
    }
}

export async function logoutUser(token: string): Promise<[number, string]> {
    if (deleteSession(token)) {
        return [200, "User logged out!"];
    } else {
        return [401, "Cannot log out if you are not logged in."];
    }
}