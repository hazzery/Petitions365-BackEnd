import path from "path";
import fs from "fs";

export async function getUserImage(userId: number): Promise<[number, string, object | void]> {
    return [501, "Not Implemented Yet!", void 0];
}

export async function uploadUserImage(imageBuffer: Buffer, userId: number, fileExtension: string): Promise<[number, string, object | void]> {
    // Define the path where the image will be saved
    const imagePath = path.join(__dirname, `../../../storage/images/${userId}.${fileExtension}`);

    try {
        await fs.promises.writeFile(imagePath, imageBuffer);
        return [201, `Image saved successfully at ${imagePath}`, void 0];
    } catch (error) {
        return [500, `Error saving image: ${error.message}`, void 0];
    }
}
export async function deleteUserImage(userId: number): Promise<[number, string, object | void]> {
    return [501, "Not Implemented Yet!", void 0];
}