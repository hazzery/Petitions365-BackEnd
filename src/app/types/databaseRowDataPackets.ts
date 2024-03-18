import {RowDataPacket} from "mysql2";

export interface SupportTier extends RowDataPacket {
    support_tier_id: number,
    title: string,
    description: string,
    cost: number
}

export interface Petition extends RowDataPacket {
    description: string;
    money_raised: number;
    petition_id: number;
    title: string;
    category_id: number;
    owner_id: number;
    owner_first_name: string;
    owner_last_name: string;
    number_of_supporters: number;
    creation_date: string;
}