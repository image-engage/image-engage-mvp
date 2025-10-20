import { Request, Response } from 'express';
import { CollageService } from '../services/collage.service';

/**
 * Handles all API requests for the collage workflow.
 * The methods in this class are responsible for request/response logic
 * and delegating business logic to the service.
 */
export class CollageController {
  static async getCollages(req: Request, res: Response): Promise<void> {
    try {
      const collages = await CollageService.getCollages();
      res.status(200).json({ success: true, data: collages });
    } catch (error) {
      console.error('Get collages error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  static async createCollage(req: Request, res: Response): Promise<void> {
    try {
      // Extract file data from the request, assuming 'express-formidable' or similar middleware
      const beforeImage = (req.files as any)?.beforeImage?.[0];
      const afterImage = (req.files as any)?.afterImage?.[0];
      const customPrompt = req.body.aiPrompt;
      
      const newCollage = await CollageService.createCollage({
        beforeImage,
        afterImage,
        customPrompt
      });
      
      res.status(201).json({ success: true, message: 'Collage created successfully', data: newCollage });
    } catch (error) {
      console.error('Create collage error:', error);
      let statusCode = 500;
      let errorMessage = 'Internal server error';

      if (error instanceof Error) {
        errorMessage = error.message;
        if (errorMessage.includes('required') || errorMessage.includes('allowed')) {
          statusCode = 400;
        }
      }

      res.status(statusCode).json({ success: false, message: errorMessage });
    }
  }
}
