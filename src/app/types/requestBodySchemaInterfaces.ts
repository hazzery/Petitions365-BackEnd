export interface UserRegister {
    firstName: string,
    lastName: string,
    email: string,
    password: string
}

export interface UserLogin {
    email: string,
    password: string
}

export interface UserEdit {
    firstName?: string,
    lastName?: string,
    email?: string,
    password?: string,
    currentPassword?: string
}

export interface PetitionSearch {
    q?: string,
    ownerId?: string,
    supporterId?: string,
    startIndex?: string,
    count?: string,
    supportingCost?: string,
    sortBy?: "ALPHABETICAL_ASC" | "ALPHABETICAL_DESC" | "COST_ASC" | "COST_DESC" | "CREATED_ASC" | "CREATED_DESC",
    categoryIds?: string | string[]
}

export interface SupportTier {
    title: string,
    description: string,
    cost: number
}

export interface PetitionPost {
    title: string,
    description: string,
    categoryId: number,
    supportTiers?: SupportTier[]
}

export interface PetitionPatch {
    title?: string,
    description?: string,
    categoryId?: string
}

export interface SupportPost {
    supportTierId: number,
    message?: string
}

export interface SupportTierPost {
    title: string,
    description: string,
    cost: number
}

export interface SupportTierPatch {
    title?: string,
    description?: string,
    cost?: number
}
