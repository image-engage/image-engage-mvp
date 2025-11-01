import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import archiver from 'archiver';
import axios from 'axios';
import { ApiResponse } from '../types';

export class DownloadController {
  static async downloadFilesAsZip(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { fileUrls, patientName } = req.body;
      
      if (!fileUrls || !Array.isArray(fileUrls) || fileUrls.length === 0) {
        res.status(400).json({
          success: false,
          message2: 'File URLs array is required'
        });
        return;
      }

      const zipName = `${patientName || 'patient'}_media_${new Date().toISOString().split('T')[0]}.zip`;
      
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);

      const archive = archiver('zip', { zlib: { level: 9 } });
      
      archive.on('error', (err) => {
        console.error('Archive error:', err);
        if (!res.headersSent) {
          res.status(500).json({ success: false, message2: 'Failed to create zip file' });
        }
      });

      archive.pipe(res);

      for (let i = 0; i < fileUrls.length; i++) {
        const url = fileUrls[i];
        try {
          const response = await axios.get(url, { responseType: 'stream' });
          const fileName = url.split('/').pop() || `file_${i + 1}.jpg`;
          archive.append(response.data, { name: fileName });
        } catch (error) {
          console.error(`Failed to download file ${url}:`, error);
        }
      }

      await archive.finalize();
    } catch (error) {
      console.error('Download zip error:', error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message2: 'Failed to create download' });
      }
    }
  }
}