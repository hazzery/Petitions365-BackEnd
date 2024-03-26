import {runPreparedSQL} from "../../config/db";
import {RowDataPacket} from "mysql2";
import path from "path";
import fs from "fs";


const imageDirectory = path.join(__dirname, "../../../storage/images");


/**
 * Check if a petition has a hero image.
 * @param petitionId - The id of the petition to check
 * @returns The filename of the petition's hero image,
 *  or null if the petition does not have a hero image,
 *  or undefined if the petition does not exist.
 */
async function checkPetitionImage(petitionId: number): Promise<string | null | undefined> {
    interface PetitionImage extends RowDataPacket {
        image_filename: string | null;
    }

    const [petition] = await runPreparedSQL<PetitionImage[]>(
        `SELECT image_filename
         FROM petition
         WHERE id = ?`,
        [petitionId]
    );
    return petition?.image_filename;
}

export async function uploadPetitionImage(
    image: Buffer,
    petitionId: number,
    fileExtension: string,
    userId: number
): Promise<[number, string, object | void]> {
    interface Petition extends RowDataPacket {
        owner_id: number
    }

    const [petition] = await runPreparedSQL<Petition[]>(
        `SELECT owner_id
         FROM petition
         WHERE id = ?`,
        [petitionId]
    );
    if (petition === undefined) {
        return [404, `No petition ${petitionId}`, void 0];
    }
    if (petition.owner_id !== userId) {
        return [403, `You (${userId}) are not the owner of petition (${petitionId})`, void 0];
    }
    const existingFileName = await checkPetitionImage(petitionId);
    const fileName = `${userId}.${fileExtension}`;
    const newFilePath = path.join(imageDirectory, fileName);
    try {
        await fs.promises.writeFile(newFilePath, image);
        await runPreparedSQL(
            `UPDATE petition
             SET image_filename = ?
             WHERE id = ?`,
            [fileName, petitionId]
        );
        if (existingFileName !== null) {
            return [200, `Image updated successfully`, void 0];
        } else {
            return [201, "Image saved successfully", void 0];
        }
    } catch (error) {
        return [500, `Error saving image: ${error.message}`, void 0];
    }
}

export async function getPetitionImage(petitionId: number): Promise<[number, string, object | void, string]> {
    const fileName = await checkPetitionImage(petitionId);
    if (!fileName) {
        return [404, `Petition ${petitionId} does not have a hero image`, void 0, ""];
    }
    const filePath = path.join(imageDirectory, fileName);
    const image = await fs.promises.readFile(filePath);
    const mimeType = 'image/' + fileName.split('.')[1];
    return [200, `Found image for petition ${petitionId}`, image, mimeType];
}