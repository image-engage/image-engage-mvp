// // src/controllers/media.controller.ts
// import { Request, Response } from 'express';
// import { StorageService } from '../services/storage.service';
// import { ApiResponse, MediaFile, UploadResponse } from '../types';

// const storageService = new StorageService();

// /**
//  * GET /api/v1/patients/:patientId/media
//  * Retrieve all raw media files for a patient
//  */
// export const getRawMedia = async (
//   req: Request,
//   res: Response<ApiResponse<MediaFile[]>>
// ): Promise<void> => {
//   try {
//     const { patientId } = req.params;
//     const practiceId = req.practice?.practiceId;

//     if (!practiceId) {
//       res.status(401).json({
//         success: false,
//         error: 'Practice ID is required'
//       });
//       return;
//     }

//     // Generate paths for raw photos
//     const paths = storageService.generateRawMediaPaths(practiceId, patientId);
    
//     // Fetch files from all paths
//     const mediaFiles = await storageService.listFilesFromPaths(paths);
    
//     res.json({
//       success: true,
//       data: mediaFiles,
//       message2: `Found ${mediaFiles.length} media files for patient ${patientId}`
//     });

//   } catch (error) {
//     console.error('Error fetching raw media:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Internal server error while fetching media files'
//     });
//   }
// };

// /**
//  * GET /api/v1/patients/:patientId/edited-media
//  * Retrieve all edited media files ready for review
//  */
// export const getEditedMedia = async (
//   req: Request,
//   res: Response<ApiResponse<MediaFile[]>>
// ): Promise<void> => {
//   try {
//     const { patientId } = req.params;
//     const practiceId = req.practice?.practiceId;

//     if (!practiceId) {
//       res.status(401).json({
//         success: false,
//         error: 'Practice ID is required'
//       });
//       return;
//     }

//     // Generate path for edited media
//     const editedPath = storageService.generateEditedMediaPath(practiceId, patientId);
    
//     // Fetch edited files
//     const mediaFiles = await storageService.listFilesFromPaths([editedPath]);
    
//     res.json({
//       success: true,
//       data: mediaFiles,
//       message2: `Found ${mediaFiles.length} edited media files for patient ${patientId}`
//     });

//   } catch (error) {
//     console.error('Error fetching edited media:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Internal server error while fetching edited media files'
//     });
//   }
// };

// /**
//  * POST /api/v1/patients/:patientId/upload
//  * Upload edited files to the ready for review folder
//  */
// export const uploadEditedFiles = async (
//   req: Request,
//   res: Response<ApiResponse<UploadResponse>>
// ): Promise<void> => {
//   try {
//     const { patientId } = req.params;
//     const practiceId = req.practice?.practiceId;
//     const files = req.files as Express.Multer.File[];

//     if (!practiceId) {
//       res.status(401).json({
//         success: false,
//         error: 'Practice ID is required'
//       });
//       return;
//     }

//     if (!files || files.length === 0) {
//       res.status(400).json({
//         success: false,
//         error: 'No files provided for upload'
//       });
//       return;
//     }

//     const uploadResults = [];
//     let successCount = 0;

//     for (const file of files) {
//       try {
//         // Generate unique file path
//         const timestamp = Date.now();
//         const fileName = `${timestamp}_${file.originalname}`;
//         const uploadPath = storageService.generateUploadPath(practiceId, patientId, fileName);
        
//         // Upload file using the new method
//         const result = await storageService.uploadEditedFile(
//           uploadPath,
//           file.buffer,
//           file.mimetype,
//         );

//         uploadResults.push({
//           fileName: file.originalname,
//           path: result.path,
//           size: result.size
//         });
        
//         successCount++;
//       } catch (error) {
//         console.error(`Error uploading file ${file.originalname}:`, error);
//         // Continue with other files even if one fails
//       }
//     }

//     if (successCount === 0) {
//       res.status(500).json({
//         success: false,
//         error: 'Failed to upload any files'
//       });
//       return;
//     }

//     res.json({
//       success: true,
//       data: {
//         filesUploaded: successCount,
//         files: uploadResults
//       },
//       message2: `Successfully uploaded ${successCount} of ${files.length} files`
//     });

//   } catch (error) {
//     console.error('Error uploading files:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Internal server error while uploading files'
//     });
//   }
// };