const sessions = new Map<string, number>();

const generateToken = (): string => {
    return Math.random().toString(36).substring(2); // remove `0.`
};

export const createSession = (userId: number): string => {
    let token = generateToken();
    while (sessions.has(token)) {
        token = generateToken();
    }
    sessions.set(token, userId);
    return token;
}
