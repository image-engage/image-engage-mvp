// import { getDriveClient, googleOAuth2Client, GOOGLE_DRIVE_SCOPES } from '../config/multer';
// import { GoogleDriveFolder } from '../types';
// import { decrypt } from '../utils/encryption';

// export class GoogleDriveService {
//   static getAuthUrl(practiceId: string): string {
//     return googleOAuth2Client.generateAuthUrl({
//       access_type: 'offline',
//       scope: GOOGLE_DRIVE_SCOPES,
//       prompt: 'consent'
//     });
//   }

//   static async getTokenFromCode(code: string) {
//     const { tokens } = await googleOAuth2Client.getToken(code);
//     return tokens;
//   }

//   static async createPracticeFolderStructure(
//     refreshToken: string,
//     practiceName: string,
//     practiceId: string
//   ): Promise<GoogleDriveFolder[]> {
//     try {
//       const decryptedToken = decrypt(refreshToken);
//       const drive = getDriveClient(decryptedToken);

//       // Create root folder
//       const rootFolderName = `EmageSmileAI - ${practiceName}`;
//       const rootFolder = await drive.files.create({
//         requestBody: {
//           name: rootFolderName,
//           mimeType: 'application/vnd.google-apps.folder'
//         }
//       });

//       const rootFolderId = rootFolder.data.id!;

//       // Define subfolders
//       const subfolders = [
//         `${practiceId}/_Consents`,
//         `${practiceId}/_RawPhotos`,
//         `${practiceId}/_EditedPhotos`,
//         `${practiceId}/_CollagesReadyForReview`,
//         `${practiceId}/_PublishedArchive`
//       ];

//       const createdFolders: GoogleDriveFolder[] = [{
//         id: rootFolderId,
//         name: rootFolderName,
//         path: `/${rootFolderName}`,
//         parent_id: undefined
//       }];

//       // Create subfolders
//       for (const folderName of subfolders) {
//         const folder = await drive.files.create({
//           requestBody: {
//             name: folderName,
//             mimeType: 'application/vnd.google-apps.folder',
//             parents: [rootFolderId]
//           }
//         });

//         createdFolders.push({
//           id: folder.data.id!,
//           name: folderName,
//           path: `/${rootFolderName}/${folderName}`,
//           parent_id: rootFolderId
//         });
//       }

//       return createdFolders;
//     } catch (error) {
//       console.error('Error creating folder structure:', error);
//       throw new Error('Failed to create Google Drive folder structure');
//     }
//   }

//   static async createPatientPhotoFolder(
//     refreshToken: string,
//     parentFolderId: string,
//     patientPhotoId: string
//   ): Promise<string> {
//     try {
//       const decryptedToken = decrypt(refreshToken);
//       const drive = getDriveClient(decryptedToken);

//       const folder = await drive.files.create({
//         requestBody: {
//           name: patientPhotoId,
//           mimeType: 'application/vnd.google-apps.folder',
//           parents: [parentFolderId]
//         }
//       });

//       return folder.data.id!;
//     } catch (error) {
//       console.error('Error creating patient photo folder:', error);
//       throw new Error('Failed to create patient photo folder');
//     }
//   }

//   static async uploadFile(
//     refreshToken: string,
//     folderId: string,
//     fileName: string,
//     fileBuffer: Buffer,
//     mimeType: string
//   ): Promise<string> {
//     try {
//       const decryptedToken = decrypt(refreshToken);
//       const drive = getDriveClient(decryptedToken);

//       const response = await drive.files.create({
//         requestBody: {
//           name: fileName,
//           parents: [folderId]
//         },
//         media: {
//           mimeType,
//           body: fileBuffer
//         }
//       });

//       return response.data.id!;
//     } catch (error) {
//       console.error('Error uploading file:', error);
//       throw new Error('Failed to upload file to Google Drive');
//     }
//   }
// }