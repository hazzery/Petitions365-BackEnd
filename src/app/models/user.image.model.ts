import {RowDataPacket} from "mysql2";
import path from "path";
import fs from "fs";

import {runSQL} from "../../config/db";

const imageDirectory = path.join(__dirname, "../../../storage/images");

/**
 * Check if a user has a profile image
 * @param userId - The id of the user to check
 * @returns The filename of the user's profile image,
 *  or null if the user does not have a profile image,
 *  or undefined if the user does not exist.
 */
async function checkUserImage(userId: number): Promise<string | null | undefined> {
    interface UserImage extends RowDataPacket{
        image_filename: string | null;
    }
    const [user] = await runSQL<UserImage[]>(`SELECT image_filename FROM user WHERE id = ${userId}`);
    return user?.image_filename;
}

export async function getUserImage(userId: number): Promise<[number, string, object | void, string]> {
    const fileName = await checkUserImage(userId);
    if (!fileName) {
        return [404, `User ${userId} does not have a profile image`, void 0, ""];
    }
    const filePath = path.join(imageDirectory, fileName);
    const image = await fs.promises.readFile(filePath);
    const mimeType = 'image/' + fileName.split('.')[1];
    return [200, `Found image for user ${userId}`, image, mimeType];
}

export async function uploadUserImage(imageBuffer: Buffer, userId: number, fileExtension: string): Promise<[number, string, object | void]> {
    const existingFileName = await checkUserImage(userId);
    if (existingFileName === undefined) {
        return [404, `No user ${userId}`, void 0];
    }
    const fileName = `${userId}.${fileExtension}`;
    const newFilePath = path.join(imageDirectory, fileName);
    try {
        await fs.promises.writeFile(newFilePath, imageBuffer);
        await runSQL(`UPDATE user SET image_filename = '${fileName}' WHERE id = ${userId}`);
        if (existingFileName !== null) {
            return [200, `Image updated successfully`, void 0];
        } else {
            return [201, "Image saved successfully", void 0];
        }
    } catch (error) {
        return [500, `Error saving image: ${error.message}`, void 0];
    }
}
export async function deleteUserImage(userId: number): Promise<[number, string, object | void]> {
    const fileName = await checkUserImage(userId);
    if (!fileName) {
        return [404, `User ${userId} does not have a profile image`, void 0];
    }
    await runSQL(`UPDATE user SET image_filename = NULL WHERE id = ${userId}`);
    const filePath = path.join(imageDirectory, fileName);
    try {
        await fs.promises.unlink(filePath);
        return [200, `Image for user ${userId} deleted successfully`, void 0];
    } catch (error) {
        return [500, `Error deleting image: ${error.message}`, void 0];
    }
}