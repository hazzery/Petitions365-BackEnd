export async function hash(password: string): Promise<string> {
    // Todo: update this to encrypt the password
    return password
}

export async function compare(password: string, comp: string): Promise<boolean> {
    // Todo: (suggested) update this to compare the encrypted passwords
    return (password === comp)
}
